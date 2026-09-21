package com.championsclub.rewards.application;

import com.championsclub.rewards.domain.Reward;
import com.championsclub.rewards.domain.RewardStatus;
import com.championsclub.security.application.Access;
import com.championsclub.users.domain.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class RewardQueries {
    private final RewardRepository rewards;
    private final PointsLedger points;
    private final RedemptionStore redemptions;
    private final Access access;

    public RewardQueries(RewardRepository rewards, PointsLedger points, RedemptionStore redemptions, Access access) {
        this.rewards = rewards;
        this.points = points;
        this.redemptions = redemptions;
        this.access = access;
    }

    public Page<RewardEligibility> catalog(long advisorId, String search, Pageable page) {
        access.advisor(advisorId);
        int balance = points.calculateAvailablePoints(advisorId);
        return rewards.search(search, page).map(reward -> new RewardEligibility(
                RewardView.from(reward),
                reward.canBeRedeemedWith(balance),
                Math.max(0, reward.requiredPoints() - balance)
        ));
    }

    public Page<RedemptionStore.Redemption> history(Long advisorId, Pageable page) {
        var actor = access.current();
        if (advisorId == null) {
            if (actor.role() != UserRole.ADVISOR) {
                throw new org.springframework.security.access.AccessDeniedException("An advisor must be selected.");
            }
            advisorId = actor.id();
        }
        access.advisor(advisorId);
        return redemptions.history(advisorId, page);
    }

    public record RewardEligibility(
            RewardView reward,
            boolean canRedeem,
            int missingPoints
    ) {
    }

    public record RewardView(
            Long id,
            String name,
            String category,
            int requiredPoints,
            RewardStatus status,
            Integer stock,
            String description,
            String imageReference,
            boolean available
    ) {
        static RewardView from(Reward reward) {
            return new RewardView(
                    reward.id(),
                    reward.name(),
                    reward.category(),
                    reward.requiredPoints(),
                    reward.status(),
                    reward.stock(),
                    reward.description(),
                    reward.imageReference(),
                    reward.available()
            );
        }
    }
}
