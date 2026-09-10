package com.championsclub.dashboard.application;

import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.analytics.application.SalesForecast;

import java.math.BigDecimal;
import java.util.List;

public record ManagerDashboard(
        String dealershipName,
        BigDecimal monthSales,
        BigDecimal monthTarget,
        int targetProgressPercentage,
        SalesForecast forecast,
        PerformanceInsight insight,
        List<LeaderboardEntry> leaderboard,
        List<EmployeeAttentionItem> employeesNeedingAttention,
        List<DashboardAlert> alerts
) {
}

