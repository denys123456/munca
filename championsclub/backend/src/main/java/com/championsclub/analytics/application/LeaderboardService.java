package com.championsclub.analytics.application;

import com.championsclub.gamification.application.GamificationConfigurationRepository;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.security.application.Access;
import com.championsclub.users.domain.AdvisorType;
import com.championsclub.users.domain.UserRole;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class LeaderboardService {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private final TeamAnalyticsRepository repository;
    private final AdvisorAnalyticsRepository advisorAnalytics;
    private final Access access;
    private final GamificationConfigurationRepository gamificationConfiguration;
    private final AnalyticsPeriodValidator periods;

    public LeaderboardService(
            TeamAnalyticsRepository repository,
            AdvisorAnalyticsRepository advisorAnalytics,
            Access access,
            GamificationConfigurationRepository gamificationConfiguration,
            AnalyticsPeriodValidator periods
    ) {
        this.repository = repository;
        this.advisorAnalytics = advisorAnalytics;
        this.access = access;
        this.gamificationConfiguration = gamificationConfiguration;
        this.periods = periods;
    }

    public Page<AdvisorRanking> leaderboard(
            long dealershipId,
            LocalDate start,
            LocalDate end,
            AdvisorType advisorType,
            Pageable page
    ) {
        var actor = access.current();
        AdvisorType effectiveAdvisorType = advisorType;
        if (actor.role() == UserRole.ADVISOR) {
            if (!actor.dealershipId().equals(dealershipId)) {
                throw new AccessDeniedException("Access denied.");
            }
            if (advisorType != null && advisorType != actor.advisorType()) {
                throw new AccessDeniedException("Advisors may only view their own cohort leaderboard.");
            }
            effectiveAdvisorType = actor.advisorType();
        } else {
            access.dealership(dealershipId);
        }
        periods.validate(start, end);
        return ranking(dealershipId, start, end, effectiveAdvisorType, page);
    }

    public Page<AdvisorRanking> ranking(
            long dealershipId,
            LocalDate start,
            LocalDate end,
            AdvisorType advisorType,
            Pageable page
    ) {
        periods.validate(start, end);
        var thresholds = gamificationConfiguration.thresholds();
        var team = repository.team(dealershipId, start, end, advisorType, page, false);
        List<AdvisorRanking> result = new ArrayList<>();
        int rank = (int) page.getOffset() + 1;
        for (var advisor : team) {
            result.add(new AdvisorRanking(
                    rank++,
                    advisor,
                    achievement(advisor.sales(), advisor.target()),
                    GamificationProgress.calculate(
                            advisor.lifetimeEarnedPoints(),
                            thresholds.bronze(),
                            thresholds.silver(),
                            thresholds.gold()
                    )
            ));
        }
        return new PageImpl<>(result, page, team.getTotalElements());
    }

    public AdvisorAnalyticsRepository.AdvisorPosition position(
            long advisorId,
            long dealershipId,
            AdvisorType advisorType,
            LocalDate start,
            LocalDate end
    ) {
        periods.validate(start, end);
        return advisorAnalytics.position(advisorId, dealershipId, advisorType, start, end);
    }

    public TeamAnalyticsRepository.TeamStatistics teamStatistics(
            long dealershipId,
            LocalDate start,
            LocalDate end
    ) {
        access.dealership(dealershipId);
        return calculateTeamStatistics(dealershipId, start, end);
    }

    public TeamAnalyticsRepository.TeamStatistics calculateTeamStatistics(
            long dealershipId,
            LocalDate start,
            LocalDate end
    ) {
        periods.validate(start, end);
        return repository.teamStatistics(dealershipId, start, end);
    }

    private BigDecimal achievement(BigDecimal sales, BigDecimal target) {
        return target.signum() == 0
                ? null
                : sales.multiply(HUNDRED).divide(target, 2, RoundingMode.HALF_UP);
    }
}
