package com.championsclub.dashboard.application;

import com.championsclub.analytics.application.AdvisorAnalyticsRepository;
import com.championsclub.analytics.application.AnalyticsResult;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.targets.application.TargetService;
import com.championsclub.users.application.UserAccount;
import java.time.LocalDate;

public record AdvisorProfile(
        UserAccount identity,
        DealershipSummary dealership,
        LocalDate reportingDate,
        AdvisorAnalyticsRepository.AdvisorLifetimeStatistics lifetime,
        TargetService.TargetSnapshot currentTarget,
        AnalyticsResult currentPeriod,
        AdvisorAnalyticsRepository.AdvisorPosition cohortPosition,
        int availablePoints,
        int lifetimeEarnedPoints,
        GamificationProgress gamification
) {
}
