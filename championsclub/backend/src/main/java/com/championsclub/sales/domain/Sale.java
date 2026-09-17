package com.championsclub.sales.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Sale {

    private final Long id;
    private final String externalReference;
    private final String currency;
    private final Long advisorId;
    private final Long dealershipId;
    private final Long productId;
    private final BigDecimal financedAmount;
    private final LocalDate saleDate;
    private final int awardedPoints;
    private final SaleStatus status;

    private Sale(Builder builder) {
        this.id = builder.id;
        this.externalReference = builder.externalReference;
        this.currency = builder.currency;
        this.advisorId = requireId(builder.advisorId);
        this.dealershipId = requireId(builder.dealershipId);
        this.productId = requireId(builder.productId);
        this.financedAmount = requirePositiveAmount(builder.financedAmount);
        this.saleDate = builder.saleDate == null ? LocalDate.now() : builder.saleDate;
        this.awardedPoints = requireNonNegative(builder.awardedPoints);
        this.status = builder.status == null ? SaleStatus.RECORDED : builder.status;
    }

    public static Builder builder() {
        return new Builder();
    }

    public boolean contributesToPerformance() {
        return status == SaleStatus.RECORDED;
    }

    public Long id() {
        return id;
    }
    public String externalReference() { return externalReference; }
    public String currency() { return currency; }
    public Sale cancel() {
        if (status != SaleStatus.RECORDED) throw new IllegalStateException("Only recorded sales can be cancelled.");
        return builder().id(id).advisorId(advisorId).dealershipId(dealershipId).productId(productId)
                .financedAmount(financedAmount).saleDate(saleDate).awardedPoints(awardedPoints)
                .externalReference(externalReference).currency(currency).status(SaleStatus.CANCELLED).build();
    }

    public Long advisorId() {
        return advisorId;
    }

    public Long dealershipId() {
        return dealershipId;
    }

    public Long productId() {
        return productId;
    }

    public BigDecimal financedAmount() {
        return financedAmount;
    }

    public LocalDate saleDate() {
        return saleDate;
    }

    public int awardedPoints() {
        return awardedPoints;
    }

    public SaleStatus status() {
        return status;
    }

    private static Long requireId(Long value) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException("Sale identifiers must be positive.");
        }
        return value;
    }

    private static BigDecimal requirePositiveAmount(BigDecimal value) {
        if (value == null || value.signum() <= 0) {
            throw new IllegalArgumentException("Sale amount must be positive.");
        }
        if (value.scale() > 2 || value.precision() - value.scale() > 12)
            throw new IllegalArgumentException("Sale amount must have at most 12 integer digits and two decimal places.");
        return value;
    }

    private static int requireNonNegative(int value) {
        if (value < 0) {
            throw new IllegalArgumentException("Awarded points cannot be negative.");
        }
        return value;
    }

    public static final class Builder {
        private Long id;
        private String externalReference;
        private String currency = "EUR";
        public Builder externalReference(String value) { this.externalReference = value; return this; }
        public Builder currency(String value) { this.currency = value; return this; }
        private Long advisorId;
        private Long dealershipId;
        private Long productId;
        private BigDecimal financedAmount;
        private LocalDate saleDate;
        private int awardedPoints;
        private SaleStatus status;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder advisorId(Long advisorId) {
            this.advisorId = advisorId;
            return this;
        }

        public Builder dealershipId(Long dealershipId) {
            this.dealershipId = dealershipId;
            return this;
        }

        public Builder productId(Long productId) {
            this.productId = productId;
            return this;
        }

        public Builder financedAmount(BigDecimal financedAmount) {
            this.financedAmount = financedAmount;
            return this;
        }

        public Builder saleDate(LocalDate saleDate) {
            this.saleDate = saleDate;
            return this;
        }

        public Builder awardedPoints(int awardedPoints) {
            this.awardedPoints = awardedPoints;
            return this;
        }

        public Builder status(SaleStatus status) {
            this.status = status;
            return this;
        }

        public Sale build() {
            return new Sale(this);
        }
    }
}
