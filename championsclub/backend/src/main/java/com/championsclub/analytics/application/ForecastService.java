package com.championsclub.analytics.application;

import com.championsclub.common.application.CachedGeneration;
import com.championsclub.security.application.Access;
import com.championsclub.targets.application.TargetService;
import com.championsclub.targets.application.TargetStore.OwnerType;
import com.championsclub.users.domain.UserRole;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class ForecastService {
    private final AnalyticsRepository analytics;
    private final MlForecastClient client;
    private final CachedGeneration cache;
    private final TargetService targets;
    private final Access access;
    private final ReportingDateProvider reportingDates;

    public ForecastService(
            AnalyticsRepository analytics,
            MlForecastClient client,
            CachedGeneration cache,
            TargetService targets,
            Access access,
            ReportingDateProvider reportingDates
    ) {
        this.analytics = analytics;
        this.client = client;
        this.cache = cache;
        this.targets = targets;
        this.access = access;
        this.reportingDates = reportingDates;
    }

    public CachedGeneration.Generated<SalesForecast> query(long id, OwnerType type, boolean refresh) {
        if (type == OwnerType.ADVISOR) {
            access.advisor(id);
        } else {
            access.dealership(id);
        }
        if (refresh && access.current().role() == UserRole.ADVISOR) {
            throw new AccessDeniedException("Only managers may refresh forecasts.");
        }
        LocalDate reportingDate = reportingDates.reportingDate();
        return calculate(id, type, targets.calculate(id, type, reportingDate), reportingDate, refresh);
    }

    public CachedGeneration.Generated<SalesForecast> calculate(
            long id,
            OwnerType type,
            TargetService.TargetSnapshot target,
            LocalDate reportingDate,
            boolean refresh
    ) {
        LocalDate historyStart = reportingDate.minusDays(179);
        var request = new MlForecastClient.ForecastRequest(
                id,
                type,
                target.periodStart(),
                target.periodEnd(),
                reportingDate,
                analytics.daily(id, type, historyStart, reportingDate),
                target.progress().targetAmount()
        );
        return cached(request, refresh);
    }

    public CachedGeneration.Generated<SalesForecast> fromSnapshot(
            long id,
            OwnerType type,
            TargetService.TargetSnapshot target,
            List<MlForecastClient.DailySale> history
    ) {
        return cached(
                new MlForecastClient.ForecastRequest(
                        id,
                        type,
                        target.periodStart(),
                        target.periodEnd(),
                        history.getLast().date(),
                        history,
                        target.progress().targetAmount()
                ),
                false
        );
    }

    private CachedGeneration.Generated<SalesForecast> cached(MlForecastClient.ForecastRequest request, boolean refresh) {
        return cache.get(
                "forecast:" + request.subjectType() + ":" + request.subjectId() + ":" + request.periodStart(),
                request,
                SalesForecast.class,
                Duration.ofHours(6),
                () -> request.historicalSales().stream().anyMatch(point -> point.amount().signum() > 0)
                        ? client.forecast(request)
                        : java.util.Optional.empty(),
                refresh
        );
    }
}
