package com.championsclub.dashboard.application;

import com.championsclub.ai.application.AiClient;
import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.analytics.application.MlForecastClient;
import com.championsclub.analytics.application.SalesForecast;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class GetManagerDashboardQueryHandler {

    private final DashboardReadRepository dashboardReadRepository;
    private final MlForecastClient mlForecastClient;
    private final AiClient aiClient;

    public GetManagerDashboardQueryHandler(
            DashboardReadRepository dashboardReadRepository,
            MlForecastClient mlForecastClient,
            AiClient aiClient
    ) {
        this.dashboardReadRepository = dashboardReadRepository;
        this.mlForecastClient = mlForecastClient;
        this.aiClient = aiClient;
    }

    @Transactional(readOnly = true)
    public ManagerDashboard getManagerDashboard(GetManagerDashboardQuery query) {
        DashboardReadRepository.ManagerDashboardData data = dashboardReadRepository.findManagerDashboardData(query.dealershipId());
        int targetProgressPercentage = calculateTargetProgress(data.monthSales(), data.monthTarget());
        SalesForecast forecast = mlForecastClient.forecastSales(query.dealershipId(), data.historicalSales(), data.monthTarget(), 30)
                .orElse(SalesForecast.unavailable());
        PerformanceInsight insight = aiClient.generateManagerInsight(new AiClient.InsightRequest(
                "MANAGER",
                List.of("Dealership sales are " + data.monthSales(), "Target progress is " + targetProgressPercentage + " percent")
        )).orElse(PerformanceInsight.unavailable(
                "AI management summary is currently unavailable.",
                List.of("Review advisors below target and protect momentum from top performers.")
        ));

        return new ManagerDashboard(
                data.dealershipName(),
                data.monthSales(),
                data.monthTarget(),
                targetProgressPercentage,
                forecast,
                insight,
                dashboardReadRepository.findLeaderboardForDealership(query.dealershipId()),
                dashboardReadRepository.findEmployeesNeedingAttention(query.dealershipId()),
                dashboardReadRepository.findUnreadAlerts(query.managerId())
        );
    }

    private int calculateTargetProgress(BigDecimal sales, BigDecimal target) {
        if (target.signum() == 0) {
            return 0;
        }
        return sales.multiply(BigDecimal.valueOf(100)).divide(target, 0, RoundingMode.HALF_UP).intValue();
    }
}

