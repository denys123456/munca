package com.championsclub.analytics.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.security.application.Access;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.math.*;
import java.time.*;
import java.time.temporal.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
@Service
public class AnalyticsService {
    private final AnalyticsRepository repository;
    private final Access access;
    private final ConfigurationStore configuration;
    public AnalyticsService(AnalyticsRepository repository, Access access, ConfigurationStore configuration) {
        this.repository=repository; this.access=access; this.configuration=configuration;
    }
    public AnalyticsResult query(long id, OwnerType type, LocalDate start, LocalDate end) {
        if (type == OwnerType.ADVISOR) access.advisor(id); else access.dealership(id);
        return calculate(id, type, start, end);
    }
    public AnalyticsResult calculate(long id, OwnerType type, LocalDate start, LocalDate end) {
        validate(start, end);
        var daily=repository.daily(id, type, start, end);
        long days=ChronoUnit.DAYS.between(start, end)+1;
        BigDecimal previous=total(repository.daily(id, type, start.minusDays(days), start.minusDays(1)));
        BigDecimal sales=total(daily);
        BigDecimal growth=previous.signum() == 0 ? null : sales.subtract(previous).multiply(BigDecimal.valueOf(100)).divide(previous, 2, RoundingMode.HALF_UP);
        return new AnalyticsResult(sales, previous, growth, daily, group(daily, true), group(daily, false),
                repository.productMix(id, type, start, end));
    }
    public Page<Ranking> leaderboard(long dealershipId, LocalDate start, LocalDate end, Pageable page) {
        var actor=access.current();
        if (!(actor.role() == com.championsclub.users.domain.UserRole.SALES_ADVISOR && actor.dealershipId() == dealershipId))
            access.dealership(dealershipId);
        validate(start, end);
        return ranking(dealershipId, start, end, page);
    }
    public Page<Ranking> ranking(long dealershipId, LocalDate start, LocalDate end, Pageable page) {
        var thresholds=configuration.thresholds();
        var team=repository.team(dealershipId, start, end, page, false);
        List<Ranking> result=new ArrayList<>();
        int rank=(int)page.getOffset()+1;
        for (var advisor : team) {
            BigDecimal achievement=advisor.target().signum() == 0 ? null : advisor.sales().multiply(BigDecimal.valueOf(100))
                    .divide(advisor.target(),2,RoundingMode.HALF_UP);
            result.add(new Ranking(rank++, advisor, achievement,
                    GamificationProgress.calculate(advisor.points(), thresholds.bronze(), thresholds.silver(), thresholds.gold())));
        }
        return new PageImpl<>(result, page, team.getTotalElements());
    }
    private void validate(LocalDate start, LocalDate end) {
        if (end.isBefore(start) || ChronoUnit.DAYS.between(start,end) > 365 || end.isAfter(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1)))
            throw new IllegalArgumentException("Analytics requires a valid period of at most one year.");
    }
    private BigDecimal total(List<MlForecastClient.DailySale> series) {
        return series.stream().map(MlForecastClient.DailySale::amount).reduce(BigDecimal.ZERO,BigDecimal::add);
    }
    private List<MlForecastClient.DailySale> group(List<MlForecastClient.DailySale> daily, boolean weekly) {
        Map<LocalDate, BigDecimal> groups=new TreeMap<>();
        for (var point : daily) {
            LocalDate date=weekly ? point.date().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) : point.date().withDayOfMonth(1);
            groups.merge(date,point.amount(),BigDecimal::add);
        }
        return groups.entrySet().stream().map(e -> new MlForecastClient.DailySale(e.getKey(),e.getValue())).toList();
    }
    public record Ranking(int rank, AnalyticsRepository.AdvisorPerformance advisor, BigDecimal achievementPercentage, GamificationProgress gamification) {}
    public record AnalyticsResult(BigDecimal sales, BigDecimal previousPeriodSales, BigDecimal growthPercentage,
                                  List<MlForecastClient.DailySale> dailySales, List<MlForecastClient.DailySale> weeklySales,
                                  List<MlForecastClient.DailySale> monthlySales, List<AnalyticsRepository.ProductMix> productMix) {}
}
