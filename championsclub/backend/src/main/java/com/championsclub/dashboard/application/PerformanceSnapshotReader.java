package com.championsclub.dashboard.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.analytics.application.*;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.rewards.application.PointsLedger;
import com.championsclub.targets.application.*;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import static com.championsclub.targets.application.TargetStore.OwnerType;
@Service
public class PerformanceSnapshotReader {
    private final TargetService targets;
    private final AnalyticsService analytics;
    private final AnalyticsRepository repository;
    private final PointsLedger points;
    private final ConfigurationStore configuration;
    public PerformanceSnapshotReader(TargetService targets,AnalyticsService analytics,AnalyticsRepository repository,
                                     PointsLedger points,ConfigurationStore configuration) {
        this.targets=targets; this.analytics=analytics; this.repository=repository; this.points=points; this.configuration=configuration;
    }
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Snapshot read(long id,OwnerType type) {
        LocalDate today=LocalDate.now();
        var target=targets.calculate(id,type,today);
        var analysis=analytics.calculate(id,type,target.periodStart(),today);
        Integer balance=type == OwnerType.ADVISOR ? points.calculateAvailablePoints(id) : null;
        var thresholds=configuration.thresholds();
        var level=balance == null ? null : GamificationProgress.calculate(balance,thresholds.bronze(),thresholds.silver(),thresholds.gold());
        LocalDate historyStart=target.periodStart().isBefore(today.minusDays(179)) ? target.periodStart() : today.minusDays(179);
        return new Snapshot(target,analysis,balance,level,repository.daily(id,type,historyStart,today));
    }
    public record Snapshot(TargetService.TargetSnapshot target,AnalyticsService.AnalyticsResult analytics,Integer availablePoints,
                           GamificationProgress gamification,List<MlForecastClient.DailySale> historicalSales) {}
}
