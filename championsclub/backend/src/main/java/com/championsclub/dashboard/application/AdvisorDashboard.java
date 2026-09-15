package com.championsclub.dashboard.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.alerts.application.AlertStore;
import com.championsclub.analytics.application.AnalyticsService;
import com.championsclub.common.application.CachedGeneration.Generated;
import com.championsclub.sales.application.SaleResponse;
import com.championsclub.users.application.UserAccount;
import java.util.List;
public record AdvisorDashboard(UserAccount identity,ConfigurationStore.DealershipData dealership,
                               PerformanceFactsService.PerformanceFacts performance,Generated<PerformanceInsight> insight,
                               List<AlertStore.AlertData> alerts,List<SaleResponse> recentSales,
                               ConfigurationStore.RewardSummary rewards,List<AnalyticsService.Ranking> leaderboard) {}
