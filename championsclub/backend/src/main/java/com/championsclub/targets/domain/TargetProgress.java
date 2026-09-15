package com.championsclub.targets.domain;
import java.math.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
public record TargetProgress(BigDecimal targetAmount, BigDecimal achievedAmount, BigDecimal remainingAmount,
                             BigDecimal achievementPercentage, long daysRemaining, BigDecimal requiredAveragePace,
                             BigDecimal currentAveragePace, Status status) {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal AHEAD_RATIO = new BigDecimal("1.10");
    private static final BigDecimal RISK_RATIO = new BigDecimal("0.90");
    public enum Status { NOT_CONFIGURED, ON_TRACK, AT_RISK, AHEAD, ACHIEVED }
    public static TargetProgress calculate(BigDecimal target, BigDecimal sales, LocalDate start, LocalDate end, LocalDate today) {
        if (end.isBefore(start) || target.signum() < 0 || sales.signum() < 0) throw new IllegalArgumentException("Invalid target progress inputs.");
        long total = ChronoUnit.DAYS.between(start, end) + 1;
        long elapsed = Math.min(total, Math.max(0, ChronoUnit.DAYS.between(start, today) + 1));
        long remainingDays = total - elapsed;
        BigDecimal remaining = target.subtract(sales).max(BigDecimal.ZERO);
        BigDecimal pace = elapsed == 0 ? BigDecimal.ZERO : sales.divide(BigDecimal.valueOf(elapsed), 2, RoundingMode.HALF_UP);
        BigDecimal required = remainingDays == 0 ? BigDecimal.ZERO : remaining.divide(BigDecimal.valueOf(remainingDays), 2, RoundingMode.HALF_UP);
        BigDecimal percentage = target.signum() == 0 ? BigDecimal.ZERO : sales.multiply(HUNDRED).divide(target, 2, RoundingMode.HALF_UP);
        Status status = Status.NOT_CONFIGURED;
        if (target.signum() > 0) {
            BigDecimal expected = target.multiply(BigDecimal.valueOf(elapsed)).divide(BigDecimal.valueOf(total), 8, RoundingMode.HALF_UP);
            status = sales.compareTo(target) >= 0 ? Status.ACHIEVED
                    : remainingDays == 0 || sales.compareTo(expected.multiply(RISK_RATIO)) < 0 ? Status.AT_RISK
                    : sales.compareTo(expected.multiply(AHEAD_RATIO)) > 0 ? Status.AHEAD : Status.ON_TRACK;
        }
        return new TargetProgress(target, sales, remaining, percentage, remainingDays, required, pace, status);
    }
}
