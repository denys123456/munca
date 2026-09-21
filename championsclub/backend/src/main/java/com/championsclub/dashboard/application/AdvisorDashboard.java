package com.championsclub.dashboard.application;

import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.alerts.application.AlertStore;
import com.championsclub.analytics.application.AdvisorAnalyticsRepository;
import com.championsclub.analytics.application.AdvisorRanking;
import com.championsclub.common.application.CachedGeneration.Generated;
import com.championsclub.recommendations.domain.Recommendation;
import com.championsclub.rewards.application.RewardRepository;
import com.championsclub.sales.application.SaleResponse;
import com.championsclub.users.application.UserAccount;
import java.util.List;

public record AdvisorDashboard(
        UserAccount identity,
        DealershipSummary dealership,
        PerformanceFactsService.PerformanceFacts performance,
        AdvisorAnalyticsRepository.AdvisorPosition cohortPosition,
        Generated<PerformanceInsight> insight,
        List<Recommendation> recommendations,
        List<AlertStore.AlertData> alerts,
        List<SaleResponse> recentSales,
        RewardRepository.RewardSummary rewards,
        List<AdvisorRanking> leaderboard
) {
}
