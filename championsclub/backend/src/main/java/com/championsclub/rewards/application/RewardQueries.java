package com.championsclub.rewards.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.security.application.Access;
import com.championsclub.users.domain.UserRole;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
@Service
public class RewardQueries {
    private final ConfigurationStore configuration;
    private final PointsLedger points;
    private final RedemptionStore redemptions;
    private final Access access;
    public RewardQueries(ConfigurationStore configuration, PointsLedger points, RedemptionStore redemptions, Access access) {
        this.configuration=configuration; this.points=points; this.redemptions=redemptions; this.access=access;
    }
    public Page<RewardEligibility> catalog(long advisorId, String search, Pageable page) {
        access.advisor(advisorId);
        int balance = points.calculateAvailablePoints(advisorId);
        return configuration.rewards(search, page).map(r -> new RewardEligibility(r,
                r.toDomain().canBeRedeemedWith(balance), Math.max(0, r.requiredPoints()-balance)));
    }
    public Page<RedemptionStore.Redemption> history(Long advisorId, Pageable page) {
        var actor = access.current();
        if (actor.role() != UserRole.ADMIN) {
            if (advisorId == null) advisorId = actor.id();
            access.advisor(advisorId);
        }
        return redemptions.history(advisorId, page);
    }
    public record RewardEligibility(ConfigurationStore.RewardData reward, boolean canRedeem, int missingPoints) {}
}
