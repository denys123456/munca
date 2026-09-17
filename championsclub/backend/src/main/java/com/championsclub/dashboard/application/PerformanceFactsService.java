package com.championsclub.dashboard.application;
import com.championsclub.analytics.application.*;
import com.championsclub.common.application.CachedGeneration.Generated;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.targets.application.TargetService;
import org.springframework.stereotype.Service;
import static com.championsclub.targets.application.TargetStore.OwnerType;
@Service
public class PerformanceFactsService {
    private final PerformanceSnapshotReader snapshots;
    private final ForecastService forecasts;
    public PerformanceFactsService(PerformanceSnapshotReader snapshots,ForecastService forecasts) {
        this.snapshots=snapshots; this.forecasts=forecasts;
    }
    public PerformanceFacts calculate(long id,OwnerType type) {
        var snapshot=snapshots.read(id,type);
        var forecast=forecasts.fromSnapshot(id,type,snapshot.target(),snapshot.historicalSales());
        return new PerformanceFacts(snapshot.target(),snapshot.analytics(),forecast,snapshot.availablePoints(),snapshot.gamification());
    }
    public record PerformanceFacts(TargetService.TargetSnapshot target,AnalyticsService.AnalyticsResult analytics,
                                   Generated<SalesForecast> forecast,Integer availablePoints,GamificationProgress gamification) {}
}
