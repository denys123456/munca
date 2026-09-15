package com.championsclub.analytics.application;
import com.championsclub.common.application.CachedGeneration;
import com.championsclub.security.application.Access;
import com.championsclub.targets.application.*;
import java.time.*;
import org.springframework.stereotype.Service;
import static com.championsclub.targets.application.TargetStore.OwnerType;
@Service
public class ForecastService {
    private final AnalyticsRepository analytics;
    private final MlForecastClient client;
    private final CachedGeneration cache;
    private final TargetService targets;
    private final Access access;
    public ForecastService(AnalyticsRepository analytics, MlForecastClient client, CachedGeneration cache, TargetService targets, Access access) {
        this.analytics=analytics; this.client=client; this.cache=cache; this.targets=targets; this.access=access;
    }
    public CachedGeneration.Generated<SalesForecast> query(long id, OwnerType type, boolean refresh) {
        if (type == OwnerType.ADVISOR) access.advisor(id); else access.dealership(id);
        if (refresh && access.current().role() == com.championsclub.users.domain.UserRole.SALES_ADVISOR)
            throw new org.springframework.security.access.AccessDeniedException("Only managers and administrators may refresh forecasts.");
        return calculate(id, type, targets.calculate(id,type,LocalDate.now()), refresh);
    }
    public CachedGeneration.Generated<SalesForecast> calculate(long id, OwnerType type, TargetService.TargetSnapshot target, boolean refresh) {
        LocalDate today=LocalDate.now();
        LocalDate historyStart=target.periodStart().isBefore(today.minusDays(179)) ? target.periodStart() : today.minusDays(179);
        var request=new MlForecastClient.ForecastRequest(id,type,target.periodStart(),target.periodEnd(),today,
                analytics.daily(id,type,historyStart,today),target.progress().targetAmount());
        return cached(request,refresh);
    }
    public CachedGeneration.Generated<SalesForecast> fromSnapshot(long id,OwnerType type,TargetService.TargetSnapshot target,
                                                                  java.util.List<MlForecastClient.DailySale> history) {
        return cached(new MlForecastClient.ForecastRequest(id,type,target.periodStart(),target.periodEnd(),
                history.getLast().date(),history,target.progress().targetAmount()),false);
    }
    private CachedGeneration.Generated<SalesForecast> cached(MlForecastClient.ForecastRequest request,boolean refresh) {
        return cache.get("forecast:"+request.subjectType()+":"+request.subjectId()+":"+request.periodStart(),request,SalesForecast.class,
                Duration.ofHours(6),() -> request.historicalSales().stream().anyMatch(point -> point.amount().signum()>0)
                        ? client.forecast(request) : java.util.Optional.empty(),refresh);
    }
}
