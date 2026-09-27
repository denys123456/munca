package com.championsclub.analytics.application;

import com.championsclub.common.application.CachedGeneration;
import com.championsclub.common.application.Pages;
import com.championsclub.targets.application.TargetService;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ForecastHistoryService {
    private static final int CHECKPOINT_DAY = 14;

    private final AnalyticsRepository analytics;
    private final MlForecastClient client;
    private final CachedGeneration cache;
    private final TargetService targets;
    private final ReportingDateProvider reportingDates;

    public ForecastHistoryService(
            AnalyticsRepository analytics,
            MlForecastClient client,
            CachedGeneration cache,
            TargetService targets,
            ReportingDateProvider reportingDates
    ) {
        this.analytics = analytics;
        this.client = client;
        this.cache = cache;
        this.targets = targets;
        this.reportingDates = reportingDates;
    }

    public List<ForecastComparison> compare(long id, OwnerType type) {
        LocalDate reportingDate = reportingDates.reportingDate();
        return targets.list(id, type, Pages.of(0, 24)).getContent().stream()
                .filter(target -> !target.periodEnd().isAfter(reportingDate))
                .sorted(Comparator.comparing(target -> target.periodStart()))
                .map(target -> compare(id, type, target))
                .toList();
    }

    private ForecastComparison compare(
            long id,
            OwnerType type,
            com.championsclub.targets.application.TargetStore.TargetData target
    ) {
        long periodDays = ChronoUnit.DAYS.between(target.periodStart(), target.periodEnd()) + 1;
        long checkpointOffset = Math.min(Math.max(0, CHECKPOINT_DAY - 1L), Math.max(0, periodDays - 1));
        LocalDate checkpoint = target.periodStart().plusDays(checkpointOffset);
        LocalDate historyStart = checkpoint.minusDays(179);
        var historicalSales = analytics.daily(id, type, historyStart, checkpoint);
        var request = new MlForecastClient.ForecastRequest(
                id,
                type,
                target.periodStart(),
                target.periodEnd(),
                checkpoint,
                historicalSales,
                target.targetAmount()
        );
        var generated = cache.get(
                "forecast-backtest:" + type + ":" + id + ":" + target.periodStart(),
                request,
                SalesForecast.class,
                Duration.ofDays(30),
                () -> historicalSales.stream().anyMatch(point -> point.amount().signum() > 0)
                        ? client.forecast(request)
                        : Optional.empty(),
                false
        );
        BigDecimal actual = analytics.periodSummary(id, type, target.periodStart(), target.periodEnd()).sales();
        BigDecimal actualAtCheckpoint = analytics.periodSummary(id, type, target.periodStart(), checkpoint).sales();
        SalesForecast forecast = generated.result();
        BigDecimal predicted = forecast == null
                ? actualAtCheckpoint.multiply(BigDecimal.valueOf(periodDays))
                        .divide(BigDecimal.valueOf(checkpointOffset + 1), 2, RoundingMode.HALF_UP)
                : forecast.predictedEndValue();
        return new ForecastComparison(
                target.id(),
                target.periodStart(),
                target.periodEnd(),
                checkpoint,
                target.targetAmount(),
                predicted,
                actual,
                forecast == null ? null : forecast.targetAchievementProbability(),
                forecast == null ? "PACE_FALLBACK" : "ML"
        );
    }

    public record ForecastComparison(
            long targetId,
            LocalDate periodStart,
            LocalDate periodEnd,
            LocalDate predictionAsOf,
            BigDecimal targetAmount,
            BigDecimal predictedEndValue,
            BigDecimal actualAchieved,
            Double targetAchievementProbability,
            String predictionSource
    ) {
    }
}
