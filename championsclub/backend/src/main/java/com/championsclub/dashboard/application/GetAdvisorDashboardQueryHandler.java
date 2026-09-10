package com.championsclub.dashboard.application;

import com.championsclub.ai.application.AiClient;
import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.analytics.application.MlForecastClient;
import com.championsclub.analytics.application.SalesForecast;
import com.championsclub.gamification.domain.GamificationProgress;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GetAdvisorDashboardQueryHandler {

    private final DashboardReadRepository dashboardReadRepository;
    private final MlForecastClient mlForecastClient;
    private final AiClient aiClient;

    public GetAdvisorDashboardQueryHandler(
            DashboardReadRepository dashboardReadRepository,
            MlForecastClient mlForecastClient,
            AiClient aiClient
    ) {
        this.dashboardReadRepository = dashboardReadRepository;
        this.mlForecastClient = mlForecastClient;
        this.aiClient = aiClient;
    }

    @Transactional(readOnly = true)
    public AdvisorDashboard getAdvisorDashboard(GetAdvisorDashboardQuery query) {
        DashboardReadRepository.AdvisorDashboardData data = dashboardReadRepository.findAdvisorDashboardData(query.advisorId());
        int targetProgressPercentage = data.monthTarget().signum() == 0
                ? 0
                : data.monthSales().multiply(java.math.BigDecimal.valueOf(100)).divide(data.monthTarget(), 0, java.math.RoundingMode.HALF_UP).intValue();

        SalesForecast forecast = mlForecastClient.forecastSales(query.advisorId(), data.historicalSales(), data.monthTarget(), 30)
                .orElse(SalesForecast.unavailable());

        PerformanceInsight insight = aiClient.generateAdvisorInsight(new AiClient.InsightRequest(
                "SALES_ADVISOR",
                List.of("Monthly sales are " + data.monthSales(), "Target progress is " + targetProgressPercentage + " percent")
        )).orElse(PerformanceInsight.unavailable(
                "AI feedback is currently unavailable.",
                List.of("Review target progress and focus on eligible financial products.")
        ));

        return new AdvisorDashboard(
                data.advisorName(),
                data.monthSales(),
                data.monthTarget(),
                targetProgressPercentage,
                data.availablePoints(),
                GamificationProgress.calculate(data.availablePoints()),
                forecast,
                insight,
                data.achievements(),
                dashboardReadRepository.findUnreadAlerts(query.advisorId()),
                dashboardReadRepository.findLeaderboardForDealership(data.dealershipId())
        );
    }
}

