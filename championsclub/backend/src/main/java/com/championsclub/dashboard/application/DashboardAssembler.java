package com.championsclub.dashboard.application;

import com.championsclub.ai.application.InsightService;
import com.championsclub.alerts.application.AlertStore;
import com.championsclub.analytics.application.LeaderboardService;
import com.championsclub.analytics.application.TeamAnalyticsRepository;
import com.championsclub.common.application.Pages;
import com.championsclub.dealerships.application.DealershipRepository;
import com.championsclub.recommendations.application.RecommendationEngine;
import com.championsclub.rewards.application.RewardRepository;
import com.championsclub.sales.application.SaleRepository;
import com.championsclub.targets.application.TargetStore.OwnerType;
import com.championsclub.targets.domain.TargetProgress;
import com.championsclub.users.application.UserAccount;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DashboardAssembler {
    private final PerformanceFactsService performance;
    private final DealershipRepository dealerships;
    private final RewardRepository rewards;
    private final LeaderboardService leaderboards;
    private final TeamAnalyticsRepository teamAnalytics;
    private final RecommendationEngine recommendations;
    private final InsightService insights;
    private final AlertStore alerts;
    private final SaleRepository sales;

    public DashboardAssembler(
            PerformanceFactsService performance,
            DealershipRepository dealerships,
            RewardRepository rewards,
            LeaderboardService leaderboards,
            TeamAnalyticsRepository teamAnalytics,
            RecommendationEngine recommendations,
            InsightService insights,
            AlertStore alerts,
            SaleRepository sales
    ) {
        this.performance = performance;
        this.dealerships = dealerships;
        this.rewards = rewards;
        this.leaderboards = leaderboards;
        this.teamAnalytics = teamAnalytics;
        this.recommendations = recommendations;
        this.insights = insights;
        this.alerts = alerts;
        this.sales = sales;
    }

    public AdvisorDashboard advisor(UserAccount user) {
        var facts = performance.calculate(user.id(), OwnerType.ADVISOR);
        var recentAlerts = alerts.list(user.id(), Pages.of(0, 5)).getContent();
        var rewardSummary = rewards.summary(facts.availablePoints());
        var deterministicRecommendations = recommendations.advisor(facts, rewardSummary);
        var insightFacts = new LinkedHashMap<String, Object>();
        insightFacts.put("advisorName", user.displayName());
        insightFacts.put("advisorType", user.advisorType());
        insightFacts.put("performance", stableFacts(facts));
        insightFacts.put("alerts", recentAlerts);
        var insight = insights.generate(user.id(), "ADVISOR", insightFacts, deterministicRecommendations);
        var recentSales = sales.history(
                new SaleRepository.SalesFilter(user.id(), null, null, null, null, null),
                Pages.of(0, 5)
        ).getContent();
        var target = facts.target();
        var position = leaderboards.position(
                user.id(),
                user.dealershipId(),
                user.advisorType(),
                target.periodStart(),
                target.periodEnd()
        );
        return new AdvisorDashboard(
                user,
                DealershipSummary.from(dealerships.get(user.dealershipId())),
                facts,
                position,
                insight,
                deterministicRecommendations,
                recentAlerts,
                recentSales,
                rewardSummary,
                leaderboards.ranking(
                        user.dealershipId(),
                        target.periodStart(),
                        target.periodEnd(),
                        user.advisorType(),
                        Pages.of(0, 5)
                ).getContent()
        );
    }

    public ManagerDashboard manager(UserAccount user) {
        var facts = performance.calculate(user.dealershipId(), OwnerType.DEALERSHIP);
        var target = facts.target();
        var ranking = leaderboards.ranking(
                user.dealershipId(),
                target.periodStart(),
                target.periodEnd(),
                null,
                Pages.of(0, 5)
        ).getContent();
        var atRisk = teamAnalytics.team(
                        user.dealershipId(),
                        target.periodStart(),
                        target.periodEnd(),
                        null,
                        Pages.of(0, 100),
                        true
                ).stream()
                .filter(advisor -> TargetProgress.calculate(
                                advisor.target(),
                                advisor.sales(),
                                target.periodStart(),
                                target.periodEnd(),
                                facts.reportingDate()
                        ).status() == TargetProgress.Status.AT_RISK)
                .limit(10)
                .toList();
        var recentAlerts = alerts.list(user.id(), Pages.of(0, 10)).getContent();
        var opportunities = recentAlerts.stream()
                .filter(alert -> alert.severity() == com.championsclub.alerts.domain.AlertSeverity.OPPORTUNITY)
                .toList();
        var teamStatistics = leaderboards.calculateTeamStatistics(
                user.dealershipId(),
                target.periodStart(),
                facts.reportingDate()
        );
        var deterministicRecommendations = recommendations.manager(facts, teamStatistics, atRisk, ranking);
        var insightFacts = new LinkedHashMap<String, Object>();
        insightFacts.put("managerName", user.displayName());
        insightFacts.put("performance", stableFacts(facts));
        insightFacts.put("teamStatistics", teamStatistics);
        insightFacts.put("topPerformers", ranking);
        insightFacts.put("atRiskAdvisors", atRisk);
        insightFacts.put("alerts", recentAlerts);
        var insight = insights.generate(user.id(), "MANAGER", insightFacts, deterministicRecommendations);
        var activity = sales.history(
                new SaleRepository.SalesFilter(null, user.dealershipId(), null, null, null, null),
                Pages.of(0, 5)
        ).getContent();
        return new ManagerDashboard(
                user,
                DealershipSummary.from(dealerships.get(user.dealershipId())),
                teamStatistics,
                facts,
                insight,
                deterministicRecommendations,
                ranking,
                atRisk,
                recentAlerts,
                activity,
                opportunities
        );
    }

    private Map<String, Object> stableFacts(PerformanceFactsService.PerformanceFacts facts) {
        var result = new LinkedHashMap<String, Object>();
        result.put("reportingDate", facts.reportingDate());
        result.put("target", facts.target());
        result.put("analytics", facts.analytics());
        result.put("forecastState", facts.forecast().state());
        result.put("forecast", facts.forecast().result());
        result.put("availablePoints", facts.availablePoints());
        result.put("lifetimeEarnedPoints", facts.lifetimeEarnedPoints());
        result.put("gamification", facts.gamification());
        return result;
    }
}
