package com.championsclub.rewards.infrastructure;

import com.championsclub.rewards.domain.RewardStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface JpaRewardRepository extends JpaRepository<RewardEntity, Long> {

    List<RewardEntity> findByStatusOrderByRequiredPointsAsc(RewardStatus status);
}

