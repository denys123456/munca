package com.championsclub.points.domain;
import java.math.BigDecimal;
import java.time.LocalDate;
public record PointRule(int pointsPerSale,BigDecimal minimumEligibleAmount,LocalDate activeFrom,LocalDate activeUntil,boolean active) {
    public PointRule {
        if (pointsPerSale<=0 || minimumEligibleAmount.signum()<0 || activeUntil.isBefore(activeFrom))
            throw new IllegalArgumentException("Invalid point rule configuration.");
    }
    public int award(boolean productEligible,BigDecimal amount,LocalDate soldAt) {
        if (amount.signum()<=0) throw new IllegalArgumentException("Sale amount must be positive.");
        return productEligible && active && !soldAt.isBefore(activeFrom) && !soldAt.isAfter(activeUntil)
                && amount.compareTo(minimumEligibleAmount)>=0 ? pointsPerSale : 0;
    }
}
