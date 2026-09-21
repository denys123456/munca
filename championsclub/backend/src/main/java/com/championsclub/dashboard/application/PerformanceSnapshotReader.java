package com.championsclub.dashboard.application;

import com.championsclub.analytics.application.AnalyticsRepository;
import com.championsclub.analytics.application.AnalyticsResult;
import com.championsclub.analytics.application.AnalyticsService;
import com.championsclub.analytics.application.MlForecastClient;
import com.championsclub.analytics.application.ReportingDateProvider;
import com.championsclub.gamification.application.GamificationConfigurationRepository;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.rewards.application.PointsLedger;
import com.championsclub.targets.application.TargetService;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerformanceSnapshotReader {
    private final TargetService targets;
    private final AnalyticsService analytics;
    private final AnalyticsRepository repository;
    private final PointsLedger points;
    private final GamificationConfigurationRepository gamificationConfiguration;
    private final ReportingDateProvider reportingDates;

    public PerformanceSnapshotReader(
            TargetService targets,
            AnalyticsService analytics,
            AnalyticsRepository repository,
            PointsLedger points,
            GamificationConfigurationRepository gamificationConfiguration,
            ReportingDateProvider reportingDates
    ) {
        this.targets = targets;
        this.analytics = analytics;
        this.repository = repository;
        this.points = points;
        this.gamificationConfiguration = gamificationConfiguration;
        this.reportingDates = reportingDates;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Snapshot read(long id, OwnerType type) {
        LocalDate reportingDate = reportingDates.reportingDate();
        var target = targets.calculate(id, type, reportingDate);
        var analysis = analytics.calculate(id, type, target.periodStart(), reportingDate);
        Integer availablePoints = type == OwnerType.ADVISOR ? points.calculateAvailablePoints(id) : null;
        Integer lifetimeEarnedPoints = type == OwnerType.ADVISOR ? points.calculateLifetimeEarnedPoints(id) : null;
        var thresholds = gamificationConfiguration.thresholds();
        var gamification = lifetimeEarnedPoints == null
                ? null
                : GamificationProgress.calculate(
                        lifetimeEarnedPoints,
                        thresholds.bronze(),
                        thresholds.silver(),
                        thresholds.gold()
                );
        LocalDate historyStart = reportingDate.minusDays(179);
        return new Snapshot(
                reportingDate,
                target,
                analysis,
                availablePoints,
                lifetimeEarnedPoints,
                gamification,
                repository.daily(id, type, historyStart, reportingDate)
        );
    }

    public record Snapshot(
            LocalDate reportingDate,
            TargetService.TargetSnapshot target,
            AnalyticsResult analytics,
            Integer availablePoints,
            Integer lifetimeEarnedPoints,
            GamificationProgress gamification,
            List<MlForecastClient.DailySale> historicalSales
    ) {
    }
}
