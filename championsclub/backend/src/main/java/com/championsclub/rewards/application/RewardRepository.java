package com.championsclub.rewards.application;

import com.championsclub.rewards.domain.Reward;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RewardRepository {
    Reward save(Reward reward);
    Optional<Reward> findById(Long rewardId);
    Optional<Reward> lock(Long rewardId);
    Page<Reward> search(String search, Pageable page);
    List<Reward> findActiveRewards();
    RewardSummary summary(int availablePoints);

    record RewardSummary(long activeRewards, long affordableRewards, Integer pointsForNextReward) {
    }
}
