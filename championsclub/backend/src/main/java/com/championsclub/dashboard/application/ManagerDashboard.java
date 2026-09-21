package com.championsclub.dashboard.application;

import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.alerts.application.AlertStore;
import com.championsclub.analytics.application.AdvisorRanking;
import com.championsclub.analytics.application.TeamAnalyticsRepository;
import com.championsclub.common.application.CachedGeneration.Generated;
import com.championsclub.recommendations.domain.Recommendation;
import com.championsclub.sales.application.SaleResponse;
import com.championsclub.users.application.UserAccount;
import java.util.List;

public record ManagerDashboard(
        UserAccount identity,
        DealershipSummary dealership,
        TeamAnalyticsRepository.TeamStatistics teamStatistics,
        PerformanceFactsService.PerformanceFacts performance,
        Generated<PerformanceInsight> insight,
        List<Recommendation> recommendations,
        List<AdvisorRanking> leaderboard,
        List<TeamAnalyticsRepository.AdvisorPerformance> atRiskAdvisors,
        List<AlertStore.AlertData> alerts,
        List<SaleResponse> recentActivity,
        List<AlertStore.AlertData> opportunities
) {
}
