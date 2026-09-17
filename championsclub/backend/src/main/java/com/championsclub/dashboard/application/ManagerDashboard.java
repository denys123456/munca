package com.championsclub.dashboard.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.alerts.application.AlertStore;
import com.championsclub.analytics.application.*;
import com.championsclub.common.application.CachedGeneration.Generated;
import com.championsclub.sales.application.SaleResponse;
import com.championsclub.users.application.UserAccount;
import java.util.List;
public record ManagerDashboard(UserAccount identity,ConfigurationStore.DealershipData dealership,
                               PerformanceFactsService.PerformanceFacts performance,Generated<PerformanceInsight> insight,
                               List<AnalyticsService.Ranking> leaderboard,List<AnalyticsRepository.AdvisorPerformance> atRiskAdvisors,
                               List<AlertStore.AlertData> alerts,List<SaleResponse> recentActivity,
                               List<AlertStore.AlertData> opportunities) {}
