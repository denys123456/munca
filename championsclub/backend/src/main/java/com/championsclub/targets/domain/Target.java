package com.championsclub.targets.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public class Target {

    private final Long id;
    private final Long ownerId;
    private final BigDecimal targetAmount;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final TargetStatus status;

    private Target(Builder builder) {
        this.id = builder.id;
        this.ownerId = requireId(builder.ownerId);
        this.targetAmount = requirePositiveAmount(builder.targetAmount);
        this.startDate = requireDate(builder.startDate);
        this.endDate = requireDate(builder.endDate);
        this.status = builder.status == null ? TargetStatus.ACTIVE : builder.status;
        requireValidPeriod();
    }

    public static Builder builder() {
        return new Builder();
    }

    public int calculateAchievementPercentage(BigDecimal currentSalesAmount) {
        if (currentSalesAmount == null || currentSalesAmount.signum() <= 0) {
            return 0;
        }
        return currentSalesAmount.multiply(BigDecimal.valueOf(100))
                .divide(targetAmount, 0, RoundingMode.HALF_UP)
                .intValue();
    }

    public boolean isActiveOn(LocalDate date) {
        return status == TargetStatus.ACTIVE && !date.isBefore(startDate) && !date.isAfter(endDate);
    }

    public Long id() {
        return id;
    }

    public Long ownerId() {
        return ownerId;
    }

    public BigDecimal targetAmount() {
        return targetAmount;
    }

    public LocalDate startDate() {
        return startDate;
    }

    public LocalDate endDate() {
        return endDate;
    }

    public TargetStatus status() {
        return status;
    }

    private void requireValidPeriod() {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Target end date cannot be before start date.");
        }
    }

    private static Long requireId(Long value) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException("Target owner must be provided.");
        }
        return value;
    }

    private static BigDecimal requirePositiveAmount(BigDecimal value) {
        if (value == null || value.signum() <= 0) {
            throw new IllegalArgumentException("Target amount must be positive.");
        }
        return value;
    }

    private static LocalDate requireDate(LocalDate value) {
        if (value == null) {
            throw new IllegalArgumentException("Target dates must be provided.");
        }
        return value;
    }

    public static final class Builder {
        private Long id;
        private Long ownerId;
        private BigDecimal targetAmount;
        private LocalDate startDate;
        private LocalDate endDate;
        private TargetStatus status;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder ownerId(Long ownerId) {
            this.ownerId = ownerId;
            return this;
        }

        public Builder targetAmount(BigDecimal targetAmount) {
            this.targetAmount = targetAmount;
            return this;
        }

        public Builder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public Builder endDate(LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        public Builder status(TargetStatus status) {
            this.status = status;
            return this;
        }

        public Target build() {
            return new Target(this);
        }
    }
}

