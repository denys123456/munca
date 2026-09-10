package com.championsclub.sales.infrastructure;

import com.championsclub.sales.domain.Sale;
import com.championsclub.sales.domain.SaleStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "sales")
class SaleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long advisorId;

    @Column(nullable = false)
    private Long dealershipId;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private BigDecimal financedAmount;

    @Column(nullable = false)
    private LocalDate saleDate;

    @Column(nullable = false)
    private int awardedPoints;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SaleStatus status;

    protected SaleEntity() {
    }

    private SaleEntity(Sale sale) {
        this.id = sale.id();
        this.advisorId = sale.advisorId();
        this.dealershipId = sale.dealershipId();
        this.productId = sale.productId();
        this.financedAmount = sale.financedAmount();
        this.saleDate = sale.saleDate();
        this.awardedPoints = sale.awardedPoints();
        this.status = sale.status();
    }

    static SaleEntity fromDomain(Sale sale) {
        return new SaleEntity(sale);
    }

    Sale toDomain() {
        return Sale.builder()
                .id(id)
                .advisorId(advisorId)
                .dealershipId(dealershipId)
                .productId(productId)
                .financedAmount(financedAmount)
                .saleDate(saleDate)
                .awardedPoints(awardedPoints)
                .status(status)
                .build();
    }
}

