package com.championsclub.rewards.application;

import com.championsclub.audit.application.AuditLog;
import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.common.application.ResourceNotFoundException;
import com.championsclub.points.domain.PointBalance;
import com.championsclub.points.domain.PointTransactionType;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RedeemRewardCommandHandler {
    private final RewardRepository rewards;
    private final PointsLedger points;
    private final UserStore users;
    private final RedemptionStore redemptions;
    private final Access access;
    private final AuditLog audit;

    public RedeemRewardCommandHandler(
            RewardRepository rewards,
            PointsLedger points,
            UserStore users,
            RedemptionStore redemptions,
            Access access,
            AuditLog audit
    ) {
        this.rewards = rewards;
        this.points = points;
        this.users = users;
        this.redemptions = redemptions;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public RedemptionStore.Redemption redeemReward(RedeemRewardCommand command) {
        access.self(command.advisorId());
        var advisor = users.lock(command.advisorId());
        if (!advisor.active() || advisor.role() != UserRole.ADVISOR) {
            throw new BusinessRuleViolationException("REDEMPTION_NOT_ALLOWED", "Only active advisors may redeem rewards.");
        }
        var reward = rewards.lock(command.rewardId())
                .orElseThrow(() -> new ResourceNotFoundException("REWARD_NOT_FOUND", "Reward not found."));
        if (!reward.available()) {
            throw new BusinessRuleViolationException("REWARD_UNAVAILABLE", "The reward is inactive or out of stock.");
        }
        var balance = new PointBalance(points.calculateAvailablePoints(advisor.id()));
        if (!reward.canBeRedeemedWith(balance.available())) {
            throw new BusinessRuleViolationException(
                    "INSUFFICIENT_POINTS",
                    "The advisor does not have enough available points for this reward."
            );
        }
        var redemption = redemptions.issue(advisor.id(), reward.id(), reward.requiredPoints());
        points.append(
                advisor.id(),
                PointTransactionType.REWARD_REDEMPTION,
                -reward.requiredPoints(),
                redemption.id(),
                "Voucher reward redemption"
        );
        if (reward.stock() != null) {
            rewards.save(com.championsclub.rewards.domain.Reward.builder()
                    .id(reward.id())
                    .name(reward.name())
                    .category(reward.category())
                    .description(reward.description())
                    .requiredPoints(reward.requiredPoints())
                    .stock(reward.stock() - 1)
                    .imageReference(reward.imageReference())
                    .status(reward.status())
                    .build());
        }
        audit.record(advisor.id(), "REWARD_REDEEMED", "REDEMPTION", redemption.id());
        return redemption;
    }
}
