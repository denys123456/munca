package com.championsclub.rewards.application;

import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.common.application.ResourceNotFoundException;
import com.championsclub.rewards.domain.Reward;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RedeemRewardCommandHandler {

    private final RewardRepository rewardRepository;
    private final PointsLedger pointsLedger;

    public RedeemRewardCommandHandler(RewardRepository rewardRepository, PointsLedger pointsLedger) {
        this.rewardRepository = rewardRepository;
        this.pointsLedger = pointsLedger;
    }

    @Transactional
    public void redeemReward(RedeemRewardCommand command) {
        Reward reward = rewardRepository.findById(command.rewardId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "REWARD_NOT_FOUND",
                        "The requested reward could not be found."
                ));

        int availablePoints = pointsLedger.calculateAvailablePoints(command.advisorId());
        if (!reward.canBeRedeemedWith(availablePoints)) {
            throw new BusinessRuleViolationException(
                    "INSUFFICIENT_POINTS",
                    "The advisor does not have enough points for this reward."
            );
        }

        pointsLedger.recordRewardRedemption(command.advisorId(), command.rewardId(), reward.requiredPoints());
    }
}

