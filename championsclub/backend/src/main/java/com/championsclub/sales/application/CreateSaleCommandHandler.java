package com.championsclub.sales.application;

import com.championsclub.audit.application.AuditLog;
import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.dealerships.application.DealershipRepository;
import com.championsclub.points.application.PointRuleRepository;
import com.championsclub.points.domain.PointTransactionType;
import com.championsclub.rewards.application.PointsLedger;
import com.championsclub.sales.domain.Sale;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateSaleCommandHandler {
    private final SaleRepository sales;
    private final FinancialProductRepository products;
    private final DealershipRepository dealerships;
    private final PointRuleRepository pointRules;
    private final UserStore users;
    private final PointsLedger points;
    private final Access access;
    private final AuditLog audit;
    private final ApplicationEventPublisher events;

    public CreateSaleCommandHandler(
            SaleRepository sales,
            FinancialProductRepository products,
            DealershipRepository dealerships,
            PointRuleRepository pointRules,
            UserStore users,
            PointsLedger points,
            Access access,
            AuditLog audit,
            ApplicationEventPublisher events
    ) {
        this.sales = sales;
        this.products = products;
        this.dealerships = dealerships;
        this.pointRules = pointRules;
        this.users = users;
        this.points = points;
        this.access = access;
        this.audit = audit;
        this.events = events;
    }

    @Transactional
    public SaleResponse createSale(CreateSaleCommand command) {
        access.advisor(command.advisorId());
        var advisor = users.lock(command.advisorId());
        if (!advisor.active() || advisor.role() != UserRole.ADVISOR || !advisor.dealershipId().equals(command.dealershipId())) {
            throw new IllegalArgumentException("An active advisor must belong to the sale dealership.");
        }
        var dealership = dealerships.get(command.dealershipId());
        if (!dealership.active()) {
            throw new IllegalArgumentException("The dealership is inactive.");
        }
        var product = products.findById(command.productId())
                .orElseThrow(() -> new com.championsclub.common.application.ResourceNotFoundException(
                        "PRODUCT_NOT_FOUND",
                        "Financial product not found."
                ));
        if (!product.acceptsSale(advisor.advisorType())) {
            throw new BusinessRuleViolationException(
                    "PRODUCT_INELIGIBLE",
                    "The financial product is not eligible for this advisor type."
            );
        }
        if (!"EUR".equals(command.currency())) {
            throw new IllegalArgumentException("Only EUR sales are supported.");
        }
        if (command.saleDate() == null || command.saleDate().isAfter(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Sales require a valid non-future sale date.");
        }
        if (command.externalReference() == null || command.externalReference().isBlank()) {
            throw new IllegalArgumentException("An external sale reference is required.");
        }
        if (sales.existsExternalReference(command.externalReference())) {
            throw new BusinessRuleViolationException("SALE_ALREADY_EXISTS", "The external sale reference already exists.");
        }
        int award = pointRules.activeRule(command.productId(), command.saleDate())
                .map(rule -> rule.award(product.isEligible(), command.contractAmount(), command.saleDate()))
                .orElse(0);
        if ((long) points.calculateAvailablePoints(advisor.id()) + award > Integer.MAX_VALUE) {
            throw new BusinessRuleViolationException(
                    "POINT_LIMIT_EXCEEDED",
                    "The award would exceed the supported points balance."
            );
        }
        var sale = sales.save(Sale.builder()
                .advisorId(command.advisorId())
                .dealershipId(command.dealershipId())
                .productId(command.productId())
                .contractAmount(command.contractAmount())
                .saleDate(command.saleDate())
                .externalReference(command.externalReference())
                .currency(command.currency())
                .awardedPoints(award)
                .build());
        if (award > 0) {
            points.append(advisor.id(), PointTransactionType.SALE_EARNED, award, sale.id(), "Eligible sale award");
        }
        audit.record(access.current().id(), "SALE_RECORDED", "SALE", sale.id());
        events.publishEvent(new com.championsclub.alerts.application.SaleChanged(advisor.id(), command.dealershipId()));
        return SaleResponse.from(sale);
    }
}
