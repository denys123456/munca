package com.championsclub.rewards.application;

import com.championsclub.rewards.domain.Reward;

import java.util.List;
import java.util.Optional;

public interface RewardRepository {

    Reward save(Reward reward);

    Optional<Reward> findById(Long rewardId);

    List<Reward> findActiveRewards();
}
