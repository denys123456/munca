package com.championsclub.dashboard.application;

import com.championsclub.analytics.application.AnalyticsResult;
import com.championsclub.analytics.application.ForecastService;
import com.championsclub.analytics.application.SalesForecast;
import com.championsclub.common.application.CachedGeneration.Generated;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.targets.application.TargetService;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class PerformanceFactsService {
    private final PerformanceSnapshotReader snapshots;
    private final ForecastService forecasts;

    public PerformanceFactsService(PerformanceSnapshotReader snapshots, ForecastService forecasts) {
        this.snapshots = snapshots;
        this.forecasts = forecasts;
    }

    public PerformanceFacts calculate(long id, OwnerType type) {
        var snapshot = snapshots.read(id, type);
        var forecast = forecasts.fromSnapshot(id, type, snapshot.target(), snapshot.historicalSales());
        return new PerformanceFacts(
                snapshot.reportingDate(),
                snapshot.target(),
                snapshot.analytics(),
                forecast,
                snapshot.availablePoints(),
                snapshot.lifetimeEarnedPoints(),
                snapshot.gamification()
        );
    }

    public record PerformanceFacts(
            LocalDate reportingDate,
            TargetService.TargetSnapshot target,
            AnalyticsResult analytics,
            Generated<SalesForecast> forecast,
            Integer availablePoints,
            Integer lifetimeEarnedPoints,
            GamificationProgress gamification
    ) {
    }
}
