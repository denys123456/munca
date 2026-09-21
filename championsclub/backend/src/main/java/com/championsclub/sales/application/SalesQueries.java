package com.championsclub.sales.application;

import com.championsclub.security.application.Access;
import com.championsclub.users.domain.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class SalesQueries {
    private final SaleRepository sales;
    private final Access access;

    public SalesQueries(SaleRepository sales, Access access) {
        this.sales = sales;
        this.access = access;
    }

    public Page<SaleResponse> history(SaleRepository.SalesFilter filter, Pageable page) {
        var actor = access.current();
        Long advisorId = filter.advisorId();
        Long dealershipId = filter.dealershipId();
        if (advisorId != null) {
            access.advisor(advisorId);
        }
        if (actor.role() == UserRole.ADVISOR) {
            advisorId = actor.id();
            dealershipId = actor.dealershipId();
        }
        if (actor.role() == UserRole.MANAGER) {
            if (dealershipId != null) {
                access.dealership(dealershipId);
            }
            dealershipId = actor.dealershipId();
        }
        if (filter.from() != null && filter.to() != null && filter.to().isBefore(filter.from())) {
            throw new IllegalArgumentException("End date cannot precede start date.");
        }
        return sales.history(
                new SaleRepository.SalesFilter(
                        advisorId,
                        dealershipId,
                        filter.productId(),
                        filter.status(),
                        filter.from(),
                        filter.to()
                ),
                page
        );
    }
}
