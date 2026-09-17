package com.championsclub.rewards.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.admin.application.ConfigurationStore.RewardData;
import com.championsclub.audit.application.AuditLog;
import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.points.domain.*;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class RedeemRewardCommandHandler {
    private final ConfigurationStore configuration;
    private final PointsLedger points;
    private final UserStore users;
    private final RedemptionStore redemptions;
    private final Access access;
    private final AuditLog audit;
    public RedeemRewardCommandHandler(ConfigurationStore configuration, PointsLedger points, UserStore users,
                                     RedemptionStore redemptions, Access access, AuditLog audit) {
        this.configuration=configuration; this.points=points; this.users=users;
        this.redemptions=redemptions; this.access=access; this.audit=audit;
    }
    @Transactional
    public RedemptionStore.Redemption redeemReward(RedeemRewardCommand command) {
        access.self(command.advisorId());
        var advisor = users.lock(command.advisorId());
        if (!advisor.active() || advisor.role() != UserRole.SALES_ADVISOR)
            throw new BusinessRuleViolationException("REDEMPTION_NOT_ALLOWED", "Only active advisors may redeem rewards.");
        var reward = configuration.reward(command.rewardId(), true);
        if (!reward.toDomain().available())
            throw new BusinessRuleViolationException("REWARD_UNAVAILABLE", "The reward is inactive or out of stock.");
        var balance = new PointBalance(points.calculateAvailablePoints(advisor.id()));
        if (!reward.toDomain().canBeRedeemedWith(balance.available()))
            throw new BusinessRuleViolationException("INSUFFICIENT_POINTS", "The advisor does not have enough points for this reward.");
        var redemption = redemptions.issue(advisor.id(), reward.id(), reward.requiredPoints());
        points.append(advisor.id(), PointTransactionType.REWARD_REDEMPTION, -reward.requiredPoints(), redemption.id(), "Voucher reward redemption");
        if (reward.stock() != null) configuration.saveReward(reward.id(), new RewardData(reward.id(), reward.name(), reward.category(),
                reward.description(), reward.requiredPoints(), reward.stock()-1, reward.imageReference(), reward.active()));
        audit.record(advisor.id(), "REWARD_REDEEMED", "REDEMPTION", redemption.id());
        return redemption;
    }
}
