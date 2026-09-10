package com.championsclub.dashboard.application;

import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.analytics.application.SalesForecast;
import com.championsclub.gamification.domain.GamificationProgress;

import java.math.BigDecimal;
import java.util.List;

public record AdvisorDashboard(
        String advisorName,
        BigDecimal monthSales,
        BigDecimal monthTarget,
        int targetProgressPercentage,
        int availablePoints,
        GamificationProgress gamification,
        SalesForecast forecast,
        PerformanceInsight insight,
        List<String> achievements,
        List<DashboardAlert> alerts,
        List<LeaderboardEntry> leaderboard
) {
}

