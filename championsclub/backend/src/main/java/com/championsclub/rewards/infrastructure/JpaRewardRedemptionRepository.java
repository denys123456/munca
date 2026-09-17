package com.championsclub.rewards.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface JpaRewardRedemptionRepository extends JpaRepository<RewardRedemptionEntity, Long> {
    org.springframework.data.domain.Page<RewardRedemptionEntity> findByAdvisorId(Long advisorId, org.springframework.data.domain.Pageable page);

    @Query("select coalesce(sum(r.redeemedPoints), 0) from RewardRedemptionEntity r where r.advisorId = :advisorId")
    int sumRedeemedPoints(@Param("advisorId") Long advisorId);
}
