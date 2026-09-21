package com.championsclub.sales.infrastructure;

import com.championsclub.sales.domain.CustomerSegment;
import com.championsclub.sales.domain.Sale;
import com.championsclub.sales.domain.SaleStatus;
import com.championsclub.sales.domain.VehicleCondition;
import com.championsclub.sales.domain.VehiclePowertrain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "sales")
class SaleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String externalReference;
    private String currency;
    @Column(nullable = false)
    private Long advisorId;
    @Column(nullable = false)
    private Long dealershipId;
    @Column(nullable = false)
    private Long productId;
    @Column(nullable = false)
    private BigDecimal contractAmount;
    @Column(nullable = false)
    private LocalDate saleDate;
    @Column(nullable = false)
    private int awardedPoints;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SaleStatus status;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehiclePowertrain vehiclePowertrain;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleCondition vehicleCondition;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerSegment customerSegment;
    private Instant cancelledAt;

    protected SaleEntity() {
    }

    private SaleEntity(Sale sale) {
        this.id = sale.id();
        this.externalReference = sale.externalReference();
        this.currency = sale.currency();
        this.advisorId = sale.advisorId();
        this.dealershipId = sale.dealershipId();
        this.productId = sale.productId();
        this.contractAmount = sale.contractAmount();
        this.saleDate = sale.saleDate();
        this.awardedPoints = sale.awardedPoints();
        this.status = sale.status();
        this.vehiclePowertrain = sale.vehiclePowertrain();
        this.vehicleCondition = sale.vehicleCondition();
        this.customerSegment = sale.customerSegment();
        this.cancelledAt = sale.cancelledAt();
    }

    static SaleEntity fromDomain(Sale sale) {
        return new SaleEntity(sale);
    }

    Sale toDomain() {
        return Sale.builder()
                .id(id)
                .externalReference(externalReference)
                .currency(currency)
                .advisorId(advisorId)
                .dealershipId(dealershipId)
                .productId(productId)
                .contractAmount(contractAmount)
                .saleDate(saleDate)
                .awardedPoints(awardedPoints)
                .status(status)
                .vehiclePowertrain(vehiclePowertrain)
                .vehicleCondition(vehicleCondition)
                .customerSegment(customerSegment)
                .cancelledAt(cancelledAt)
                .build();
    }
}
