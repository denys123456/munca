package com.championsclub.sales.domain;

import java.math.BigDecimal;

public class FinancialProduct {

    private final Long id;
    private final String name;
    private final int pointsPerThousandEuro;
    private final boolean isEligible;

    private FinancialProduct(Builder builder) {
        this.id = builder.id;
        this.name = requireText(builder.name);
        this.pointsPerThousandEuro = requirePositive(builder.pointsPerThousandEuro);
        this.isEligible = builder.isEligible;
    }

    public static Builder builder() {
        return new Builder();
    }

    public int calculatePoints(BigDecimal financedAmount) {
        if (!isEligible || financedAmount == null || financedAmount.signum() <= 0) {
            return 0;
        }
        return financedAmount.divideToIntegralValue(BigDecimal.valueOf(1000)).intValue() * pointsPerThousandEuro;
    }

    public Long id() {
        return id;
    }

    public String name() {
        return name;
    }

    public int pointsPerThousandEuro() {
        return pointsPerThousandEuro;
    }

    public boolean isEligible() {
        return isEligible;
    }

    private static String requireText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Financial product name must be provided.");
        }
        return value.trim();
    }

    private static int requirePositive(int value) {
        if (value <= 0) {
            throw new IllegalArgumentException("Points per thousand Euro must be positive.");
        }
        return value;
    }

    public static final class Builder {
        private Long id;
        private String name;
        private int pointsPerThousandEuro;
        private boolean isEligible = true;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder pointsPerThousandEuro(int pointsPerThousandEuro) {
            this.pointsPerThousandEuro = pointsPerThousandEuro;
            return this;
        }

        public Builder eligible(boolean eligible) {
            isEligible = eligible;
            return this;
        }

        public FinancialProduct build() {
            return new FinancialProduct(this);
        }
    }
}

