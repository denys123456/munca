package com.championsclub.points.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.audit.application.AuditLog;
import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.points.domain.PointTransactionType;
import com.championsclub.rewards.application.PointsLedger;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserStore;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class PointService {
    private final PointsLedger ledger;
    private final PointQueries queries;
    private final Access access;
    private final UserStore users;
    private final ConfigurationStore configuration;
    private final AuditLog audit;
    public PointService(PointsLedger ledger,PointQueries queries,Access access,UserStore users,ConfigurationStore configuration,AuditLog audit) {
        this.ledger=ledger; this.queries=queries; this.access=access; this.users=users; this.configuration=configuration; this.audit=audit;
    }
    public PointSummary summary(long advisorId) {
        access.advisor(advisorId);
        int balance=ledger.calculateAvailablePoints(advisorId);
        var thresholds=configuration.thresholds();
        return new PointSummary(balance,GamificationProgress.calculate(balance,thresholds.bronze(),thresholds.silver(),thresholds.gold()));
    }
    public Page<PointQueries.Transaction> history(long advisorId,Pageable page) {
        access.advisor(advisorId);
        return queries.history(advisorId,page);
    }
    @Transactional
    public PointSummary adjust(long advisorId,int amount,String reason) {
        access.admin();
        access.advisor(advisorId);
        users.lock(advisorId);
        if (amount == 0) throw new IllegalArgumentException("An adjustment must be nonzero.");
        long balance=(long)ledger.calculateAvailablePoints(advisorId)+amount;
        if (balance < 0 || balance > Integer.MAX_VALUE)
            throw new BusinessRuleViolationException("INVALID_POINT_BALANCE","The adjustment would create an invalid points balance.");
        long source=audit.record(access.current().id(),"MANUAL_POINTS_ADJUSTMENT","USER",advisorId);
        ledger.append(advisorId,PointTransactionType.MANUAL_ADJUSTMENT,amount,source,reason);
        return summary(advisorId);
    }
    public record PointSummary(int availablePoints,GamificationProgress gamification) {}
}
