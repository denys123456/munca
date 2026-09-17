package com.championsclub.sales.application;
import com.championsclub.security.application.Access;
import com.championsclub.users.domain.UserRole;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
@Service
public class SalesQueries {
    private final SaleRepository sales;
    private final Access access;
    public SalesQueries(SaleRepository sales, Access access) { this.sales=sales; this.access=access; }
    public Page<SaleResponse> history(SaleRepository.SalesFilter filter, Pageable page) {
        var actor = access.current();
        Long advisor = filter.advisorId();
        Long dealership = filter.dealershipId();
        if (advisor != null) access.advisor(advisor);
        if (actor.role() == UserRole.SALES_ADVISOR) advisor = actor.id();
        if (actor.role() == UserRole.MANAGER) {
            if (dealership != null) access.dealership(dealership);
            dealership = actor.dealershipId();
        }
        if (filter.from() != null && filter.to() != null && filter.to().isBefore(filter.from()))
            throw new IllegalArgumentException("End date cannot precede start date.");
        return sales.history(new SaleRepository.SalesFilter(advisor, dealership, filter.productId(), filter.status(), filter.from(), filter.to()), page);
    }
}
