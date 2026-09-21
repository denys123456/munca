package com.championsclub.sales.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public class Sale {
    private final Long id;
    private final String externalReference;
    private final String currency;
    private final Long advisorId;
    private final Long dealershipId;
    private final Long productId;
    private final BigDecimal contractAmount;
    private final LocalDate saleDate;
    private final int awardedPoints;
    private final SaleStatus status;
    private final VehiclePowertrain vehiclePowertrain;
    private final VehicleCondition vehicleCondition;
    private final CustomerSegment customerSegment;
    private final Instant cancelledAt;

    private Sale(Builder builder) {
        this.id = builder.id;
        this.externalReference = requireText(builder.externalReference, "External sale reference must be provided.");
        this.currency = requireText(builder.currency, "Sale currency must be provided.");
        this.advisorId = requireId(builder.advisorId);
        this.dealershipId = requireId(builder.dealershipId);
        this.productId = requireId(builder.productId);
        this.contractAmount = requirePositiveAmount(builder.contractAmount);
        this.saleDate = builder.saleDate == null ? LocalDate.now() : builder.saleDate;
        this.awardedPoints = requireNonNegative(builder.awardedPoints);
        this.status = builder.status == null ? SaleStatus.RECORDED : builder.status;
        this.vehiclePowertrain = builder.vehiclePowertrain == null ? VehiclePowertrain.UNKNOWN : builder.vehiclePowertrain;
        this.vehicleCondition = builder.vehicleCondition == null ? VehicleCondition.UNKNOWN : builder.vehicleCondition;
        this.customerSegment = builder.customerSegment == null ? CustomerSegment.UNKNOWN : builder.customerSegment;
        this.cancelledAt = builder.cancelledAt;
        validateCancellation();
    }

    public static Builder builder() {
        return new Builder();
    }

    public boolean contributesToPerformance() {
        return status == SaleStatus.RECORDED;
    }

    public Sale cancel() {
        if (status != SaleStatus.RECORDED) {
            throw new IllegalStateException("Only recorded sales can be cancelled.");
        }
        return builder()
                .id(id)
                .advisorId(advisorId)
                .dealershipId(dealershipId)
                .productId(productId)
                .contractAmount(contractAmount)
                .saleDate(saleDate)
                .awardedPoints(awardedPoints)
                .externalReference(externalReference)
                .currency(currency)
                .status(SaleStatus.CANCELLED)
                .vehiclePowertrain(vehiclePowertrain)
                .vehicleCondition(vehicleCondition)
                .customerSegment(customerSegment)
                .cancelledAt(Instant.now())
                .build();
    }

    public Long id() {
        return id;
    }

    public String externalReference() {
        return externalReference;
    }

    public String currency() {
        return currency;
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

    public BigDecimal contractAmount() {
        return contractAmount;
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

    public VehiclePowertrain vehiclePowertrain() {
        return vehiclePowertrain;
    }

    public VehicleCondition vehicleCondition() {
        return vehicleCondition;
    }

    public CustomerSegment customerSegment() {
        return customerSegment;
    }

    public Instant cancelledAt() {
        return cancelledAt;
    }

    private void validateCancellation() {
        if (status == SaleStatus.RECORDED && cancelledAt != null) {
            throw new IllegalArgumentException("Recorded sales cannot have a cancellation timestamp.");
        }
        if (status == SaleStatus.CANCELLED && cancelledAt == null) {
            throw new IllegalArgumentException("Cancelled sales require a cancellation timestamp.");
        }
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private static Long requireId(Long value) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException("Sale identifiers must be positive.");
        }
        return value;
    }

    private static BigDecimal requirePositiveAmount(BigDecimal value) {
        if (value == null || value.signum() <= 0) {
            throw new IllegalArgumentException("Contract amount must be positive.");
        }
        if (value.scale() > 2 || value.precision() - value.scale() > 12) {
            throw new IllegalArgumentException("Contract amount must have at most 12 integer digits and two decimal places.");
        }
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
        private Long advisorId;
        private Long dealershipId;
        private Long productId;
        private BigDecimal contractAmount;
        private LocalDate saleDate;
        private int awardedPoints;
        private SaleStatus status;
        private VehiclePowertrain vehiclePowertrain = VehiclePowertrain.UNKNOWN;
        private VehicleCondition vehicleCondition = VehicleCondition.UNKNOWN;
        private CustomerSegment customerSegment = CustomerSegment.UNKNOWN;
        private Instant cancelledAt;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder externalReference(String externalReference) {
            this.externalReference = externalReference;
            return this;
        }

        public Builder currency(String currency) {
            this.currency = currency;
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

        public Builder contractAmount(BigDecimal contractAmount) {
            this.contractAmount = contractAmount;
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

        public Builder vehiclePowertrain(VehiclePowertrain vehiclePowertrain) {
            this.vehiclePowertrain = vehiclePowertrain;
            return this;
        }

        public Builder vehicleCondition(VehicleCondition vehicleCondition) {
            this.vehicleCondition = vehicleCondition;
            return this;
        }

        public Builder customerSegment(CustomerSegment customerSegment) {
            this.customerSegment = customerSegment;
            return this;
        }

        public Builder cancelledAt(Instant cancelledAt) {
            this.cancelledAt = cancelledAt;
            return this;
        }

        public Sale build() {
            return new Sale(this);
        }
    }
}
