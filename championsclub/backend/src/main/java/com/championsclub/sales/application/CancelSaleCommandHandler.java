package com.championsclub.sales.application;
import com.championsclub.audit.application.AuditLog;
import com.championsclub.common.application.*;
import com.championsclub.points.domain.PointTransactionType;
import com.championsclub.rewards.application.PointsLedger;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class CancelSaleCommandHandler {
    private final SaleRepository sales;
    private final UserStore users;
    private final PointsLedger points;
    private final Access access;
    private final AuditLog audit;
    private final org.springframework.context.ApplicationEventPublisher events;
    public CancelSaleCommandHandler(SaleRepository sales, UserStore users, PointsLedger points, Access access, AuditLog audit,
                                   org.springframework.context.ApplicationEventPublisher events) {
        this.sales=sales; this.users=users; this.points=points; this.access=access; this.audit=audit;
        this.events=events;
    }
    @Transactional
    public SaleResponse cancel(long id) {
        var existing = sales.find(id).orElseThrow(() -> new ResourceNotFoundException("SALE_NOT_FOUND", "Sale not found."));
        access.advisor(existing.advisorId());
        users.lock(existing.advisorId());
        var sale = sales.lock(id).orElseThrow();
        if (!sale.contributesToPerformance()) throw new BusinessRuleViolationException("SALE_ALREADY_CANCELLED", "The sale is already cancelled.");
        if (points.calculateAvailablePoints(sale.advisorId()) < sale.awardedPoints())
            throw new BusinessRuleViolationException("INSUFFICIENT_POINTS", "Cancellation would reverse points that have already been spent.");
        var cancelled = sales.save(sale.cancel());
        points.append(sale.advisorId(), PointTransactionType.SALE_REVERSAL, -sale.awardedPoints(), sale.id(), "Sale cancellation reversal");
        audit.record(access.current().id(), "SALE_CANCELLED", "SALE", id);
        events.publishEvent(new com.championsclub.alerts.application.SaleChanged(sale.advisorId(),sale.dealershipId()));
        return SaleResponse.from(cancelled);
    }
}
