package com.championsclub.rewards.infrastructure;
import com.championsclub.rewards.application.RedemptionStore;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Repository;
@Repository
class JpaRedemptionStore implements RedemptionStore {
    private final JpaRewardRedemptionRepository repository;
    JpaRedemptionStore(JpaRewardRedemptionRepository repository) { this.repository=repository; }
    public Redemption issue(long advisorId, long rewardId, int points) {
        return repository.saveAndFlush(new RewardRedemptionEntity(advisorId, rewardId, points)).response();
    }
    public Page<Redemption> history(Long advisorId, Pageable page) {
        return (advisorId == null ? repository.findAll(page) : repository.findByAdvisorId(advisorId, page))
                .map(RewardRedemptionEntity::response);
    }
}
