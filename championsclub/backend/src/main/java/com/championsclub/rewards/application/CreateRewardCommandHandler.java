package com.championsclub.rewards.application;

import com.championsclub.rewards.domain.Reward;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateRewardCommandHandler {

    private final RewardRepository rewardRepository;

    public CreateRewardCommandHandler(RewardRepository rewardRepository) {
        this.rewardRepository = rewardRepository;
    }

    @Transactional
    public RewardCatalogItem createReward(CreateRewardCommand command) {
        Reward reward = Reward.builder()
                .name(command.name())
                .category(command.category())
                .requiredPoints(command.requiredPoints())
                .build();
        Reward savedReward = rewardRepository.save(reward);
        return new RewardCatalogItem(
                savedReward.id(),
                savedReward.name(),
                savedReward.category(),
                savedReward.requiredPoints(),
                false
        );
    }
}

