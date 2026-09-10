package com.championsclub.rewards.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GetRewardCatalogQueryHandler {

    private final RewardRepository rewardRepository;
    private final PointsLedger pointsLedger;

    public GetRewardCatalogQueryHandler(RewardRepository rewardRepository, PointsLedger pointsLedger) {
        this.rewardRepository = rewardRepository;
        this.pointsLedger = pointsLedger;
    }

    @Transactional(readOnly = true)
    public List<RewardCatalogItem> getRewardCatalog(GetRewardCatalogQuery query) {
        int availablePoints = pointsLedger.calculateAvailablePoints(query.advisorId());
        return rewardRepository.findActiveRewards()
                .stream()
                .map(reward -> new RewardCatalogItem(
                        reward.id(),
                        reward.name(),
                        reward.category(),
                        reward.requiredPoints(),
                        reward.canBeRedeemedWith(availablePoints)
                ))
                .toList();
    }
}

