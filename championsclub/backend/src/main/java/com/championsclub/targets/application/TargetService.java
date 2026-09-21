package com.championsclub.targets.application;

import com.championsclub.audit.application.AuditLog;
import com.championsclub.dealerships.application.DealershipRepository;
import com.championsclub.sales.application.SaleRepository;
import com.championsclub.security.application.Access;
import com.championsclub.targets.domain.TargetProgress;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.championsclub.targets.application.TargetStore.OwnerType;
import static com.championsclub.targets.application.TargetStore.TargetData;

@Service
public class TargetService {
    private final TargetStore targets;
    private final Access access;
    private final UserStore users;
    private final DealershipRepository dealerships;
    private final SaleRepository sales;
    private final AuditLog audit;

    public TargetService(
            TargetStore targets,
            Access access,
            UserStore users,
            DealershipRepository dealerships,
            SaleRepository sales,
            AuditLog audit
    ) {
        this.targets = targets;
        this.access = access;
        this.users = users;
        this.dealerships = dealerships;
        this.sales = sales;
        this.audit = audit;
    }

    @Transactional
    public TargetData save(Long id, TargetData data) {
        access.manager();
        if (id != null) {
            var existing = targets.get(id);
            authorizeManager(existing.ownerId(), existing.ownerType());
        }
        validate(data);
        authorizeManager(data.ownerId(), data.ownerType());
        var result = targets.save(id, data, access.current().id());
        audit.record(access.current().id(), "TARGET_CHANGED", "TARGET", result.id());
        return result;
    }

    public Page<TargetData> list(long ownerId, OwnerType type, Pageable page) {
        authorizeRead(ownerId, type);
        return targets.list(ownerId, type, page);
    }

    public TargetData get(long id) {
        var target = targets.get(id);
        authorizeRead(target.ownerId(), target.ownerType());
        return target;
    }

    public TargetSnapshot progress(long ownerId, OwnerType type, LocalDate date) {
        authorizeRead(ownerId, type);
        return calculate(ownerId, type, date);
    }

    public TargetSnapshot calculate(long ownerId, OwnerType type, LocalDate date) {
        var target = targets.current(ownerId, type, date);
        LocalDate start = target.map(TargetData::periodStart).orElse(date.withDayOfMonth(1));
        LocalDate end = target.map(TargetData::periodEnd).orElse(start.plusMonths(1).minusDays(1));
        BigDecimal amount = target.map(TargetData::targetAmount).orElse(BigDecimal.ZERO);
        LocalDate effectiveDate = date.isBefore(end) ? date : end;
        BigDecimal achieved = type == OwnerType.ADVISOR
                ? sales.sumRecordedSalesForAdvisor(ownerId, start, effectiveDate)
                : sales.sumRecordedSalesForDealership(ownerId, start, effectiveDate);
        return new TargetSnapshot(
                target.map(TargetData::id).orElse(null),
                start,
                end,
                "EUR",
                TargetProgress.calculate(amount, achieved, start, end, date)
        );
    }

    private void validate(TargetData data) {
        if (data.periodEnd().isBefore(data.periodStart()) || !"EUR".equals(data.currency())) {
            throw new IllegalArgumentException("Invalid target period or currency.");
        }
        if (java.time.temporal.ChronoUnit.DAYS.between(data.periodStart(), data.periodEnd()) > 365) {
            throw new IllegalArgumentException("Target periods cannot exceed one year.");
        }
        com.championsclub.targets.domain.Target.builder()
                .ownerId(data.ownerId())
                .targetAmount(data.targetAmount())
                .startDate(data.periodStart())
                .endDate(data.periodEnd())
                .build();
        if (data.ownerType() == OwnerType.ADVISOR) {
            var advisor = users.get(data.ownerId());
            if (advisor.role() != UserRole.ADVISOR) {
                throw new IllegalArgumentException("Advisor target requires an advisor.");
            }
        } else {
            dealerships.get(data.ownerId());
        }
    }

    private void authorizeRead(long ownerId, OwnerType type) {
        if (type == OwnerType.ADVISOR) {
            access.advisor(ownerId);
        } else {
            access.dealership(ownerId);
        }
    }

    private void authorizeManager(long ownerId, OwnerType type) {
        access.manager();
        if (type == OwnerType.ADVISOR) {
            access.advisor(ownerId);
        } else {
            access.dealership(ownerId);
        }
    }

    public record TargetSnapshot(
            Long targetId,
            LocalDate periodStart,
            LocalDate periodEnd,
            String currency,
            TargetProgress progress
    ) {
    }
}
