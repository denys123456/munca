package com.championsclub.analytics.application;

import com.championsclub.gamification.domain.GamificationProgress;
import java.math.BigDecimal;

public record AdvisorRanking(
        int rank,
        TeamAnalyticsRepository.AdvisorPerformance advisor,
        BigDecimal achievementPercentage,
        GamificationProgress gamification
) {
}
