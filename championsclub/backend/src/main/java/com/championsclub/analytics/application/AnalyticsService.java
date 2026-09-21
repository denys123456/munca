package com.championsclub.analytics.application;

import com.championsclub.security.application.Access;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private final AnalyticsRepository repository;
    private final Access access;
    private final AnalyticsPeriodValidator periods;

    public AnalyticsService(
            AnalyticsRepository repository,
            Access access,
            AnalyticsPeriodValidator periods
    ) {
        this.repository = repository;
        this.access = access;
        this.periods = periods;
    }

    public AnalyticsResult query(long id, OwnerType type, LocalDate start, LocalDate end) {
        if (type == OwnerType.ADVISOR) {
            access.advisor(id);
        } else {
            access.dealership(id);
        }
        return calculate(id, type, start, end);
    }

    public AnalyticsResult calculate(long id, OwnerType type, LocalDate start, LocalDate end) {
        periods.validate(start, end);
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        LocalDate previousStart = start.minusDays(days);
        LocalDate previousEnd = start.minusDays(1);
        var current = repository.periodSummary(id, type, start, end);
        var previous = repository.periodSummary(id, type, previousStart, previousEnd);
        var daily = repository.daily(id, type, start, end);
        return new AnalyticsResult(
                start,
                end,
                current.sales(),
                current.recordedContracts(),
                current.averageContractAmount(),
                current.cancelledContracts(),
                cancellationRate(current),
                previous.sales(),
                previous.recordedContracts(),
                percentageChange(current.sales(), previous.sales()),
                percentageChange(current.recordedContracts(), previous.recordedContracts()),
                daily,
                group(daily, true),
                group(daily, false),
                productPerformance(repository.productMix(id, type, start, end), current),
                dimensionPerformance(repository.productCategoryMix(id, type, start, end), current.recordedContracts()),
                dimensionPerformance(repository.powertrainMix(id, type, start, end), current.recordedContracts()),
                dimensionPerformance(repository.vehicleConditionMix(id, type, start, end), current.recordedContracts()),
                dimensionPerformance(repository.customerSegmentMix(id, type, start, end), current.recordedContracts())
        );
    }

    private BigDecimal cancellationRate(AnalyticsRepository.PeriodSummary summary) {
        long totalContracts = summary.recordedContracts() + summary.cancelledContracts();
        return totalContracts == 0
                ? BigDecimal.ZERO
                : percentage(summary.cancelledContracts(), totalContracts);
    }

    private BigDecimal percentageChange(BigDecimal current, BigDecimal previous) {
        return previous.signum() == 0
                ? null
                : current.subtract(previous).multiply(HUNDRED).divide(previous, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal percentageChange(long current, long previous) {
        return previous == 0
                ? null
                : BigDecimal.valueOf(current - previous)
                        .multiply(HUNDRED)
                        .divide(BigDecimal.valueOf(previous), 2, RoundingMode.HALF_UP);
    }

    private List<ProductPerformance> productPerformance(
            List<AnalyticsRepository.ProductMix> products,
            AnalyticsRepository.PeriodSummary summary
    ) {
        return products.stream()
                .map(product -> new ProductPerformance(
                        product.productId(),
                        product.productCode(),
                        product.productName(),
                        product.category(),
                        product.sales(),
                        product.transactions(),
                        percentage(product.sales(), summary.sales()),
                        percentage(product.transactions(), summary.recordedContracts())
                ))
                .toList();
    }

    private List<DimensionPerformance> dimensionPerformance(
            List<AnalyticsRepository.DimensionMix> values,
            long totalContracts
    ) {
        return values.stream()
                .map(value -> new DimensionPerformance(
                        value.value(),
                        value.sales(),
                        value.transactions(),
                        percentage(value.transactions(), totalContracts)
                ))
                .toList();
    }

    private BigDecimal percentage(BigDecimal value, BigDecimal total) {
        return total.signum() == 0
                ? BigDecimal.ZERO
                : value.multiply(HUNDRED).divide(total, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal percentage(long value, long total) {
        return total == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(value)
                        .multiply(HUNDRED)
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private List<MlForecastClient.DailySale> group(List<MlForecastClient.DailySale> daily, boolean weekly) {
        Map<LocalDate, BigDecimal> groups = new TreeMap<>();
        for (var point : daily) {
            LocalDate date = weekly
                    ? point.date().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                    : point.date().withDayOfMonth(1);
            groups.merge(date, point.amount(), BigDecimal::add);
        }
        return groups.entrySet().stream()
                .map(entry -> new MlForecastClient.DailySale(entry.getKey(), entry.getValue()))
                .toList();
    }
}
