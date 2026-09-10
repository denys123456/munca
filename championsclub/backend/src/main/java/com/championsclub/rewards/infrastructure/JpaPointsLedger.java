package com.championsclub.rewards.infrastructure;

import com.championsclub.rewards.application.PointsLedger;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class JpaPointsLedger implements PointsLedger {

    private final JdbcTemplate jdbcTemplate;
    private final JpaRewardRedemptionRepository rewardRedemptionRepository;

    JpaPointsLedger(JdbcTemplate jdbcTemplate, JpaRewardRedemptionRepository rewardRedemptionRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.rewardRedemptionRepository = rewardRedemptionRepository;
    }

    @Override
    public int calculateAvailablePoints(Long advisorId) {
        Integer awardedPoints = jdbcTemplate.queryForObject(
                "select coalesce(sum(awarded_points), 0) from sales where advisor_id = ? and status = 'RECORDED'",
                Integer.class,
                advisorId
        );
        return awardedPoints == null ? 0 : awardedPoints - rewardRedemptionRepository.sumRedeemedPoints(advisorId);
    }

    @Override
    public void recordRewardRedemption(Long advisorId, Long rewardId, int redeemedPoints) {
        rewardRedemptionRepository.save(new RewardRedemptionEntity(advisorId, rewardId, redeemedPoints));
    }
}

