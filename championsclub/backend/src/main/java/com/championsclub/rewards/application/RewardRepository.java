package com.championsclub.rewards.application;

import com.championsclub.rewards.domain.Reward;

import java.util.List;
import java.util.Optional;

public interface RewardRepository {

    Reward save(Reward reward);

    Optional<Reward> findById(Long rewardId);
    Optional<Reward> lock(Long rewardId);
    org.springframework.data.domain.Page<Reward> search(String search,org.springframework.data.domain.Pageable page);

    List<Reward> findActiveRewards();
}
