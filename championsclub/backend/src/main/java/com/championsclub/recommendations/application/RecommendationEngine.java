package com.championsclub.recommendations.application;

import com.championsclub.analytics.application.AdvisorRanking;
import com.championsclub.analytics.application.DimensionPerformance;
import com.championsclub.analytics.application.ProductPerformance;
import com.championsclub.analytics.application.SalesForecast;
import com.championsclub.analytics.application.TeamAnalyticsRepository;
import com.championsclub.dashboard.application.PerformanceFactsService;
import com.championsclub.recommendations.domain.Recommendation;
import com.championsclub.recommendations.domain.RecommendationPriority;
import com.championsclub.recommendations.domain.RecommendationType;
import com.championsclub.rewards.application.RewardRepository;
import com.championsclub.targets.domain.TargetProgress;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class RecommendationEngine {
    private static final BigDecimal STRONG_GROWTH_PERCENTAGE = BigDecimal.valueOf(20);
    private static final double FORECAST_RISK_PROBABILITY = 0.50;
    private static final int CLOSE_TO_LEVEL_PROGRESS_PERCENTAGE = 80;

    public List<Recommendation> advisor(
            PerformanceFactsService.PerformanceFacts facts,
            RewardRepository.RewardSummary rewards
    ) {
        var recommendations = new ArrayList<Recommendation>();
        addTargetRecovery(recommendations, facts);
        addProductFocus(recommendations, facts);
        addLevelProgress(recommendations, facts);
        if (rewards.affordableRewards() > 0) {
            recommendations.add(new Recommendation(
                    RecommendationType.REWARD_OPPORTUNITY,
                    RecommendationPriority.LOW,
                    "Reward available",
                    "Review the active rewards that your available points can redeem.",
                    "At least one active reward is currently affordable with the available balance.",
                    Map.of(
                            "availablePoints", facts.availablePoints(),
                            "affordableRewards", rewards.affordableRewards()
                    )
            ));
        }
        addMomentum(recommendations, facts);
        return prioritized(recommendations);
    }

    public List<Recommendation> manager(
            PerformanceFactsService.PerformanceFacts facts,
            TeamAnalyticsRepository.TeamStatistics teamStatistics,
            List<TeamAnalyticsRepository.AdvisorPerformance> atRiskAdvisors,
            List<AdvisorRanking> ranking
    ) {
        var recommendations = new ArrayList<Recommendation>();
        addTargetRecovery(recommendations, facts);
        if (!atRiskAdvisors.isEmpty()) {
            var advisorNames = atRiskAdvisors.stream().limit(5).map(TeamAnalyticsRepository.AdvisorPerformance::advisorName).toList();
            recommendations.add(new Recommendation(
                    RecommendationType.COACHING_REQUIRED,
                    RecommendationPriority.HIGH,
                    "Coach advisors at risk",
                    "Review the at-risk advisors and agree a concrete recovery action for the remaining target period.",
                    "One or more advisors in the dealership are currently below the expected target pace.",
                    Map.of(
                            "atRiskAdvisorCount", atRiskAdvisors.size(),
                            "advisorNames", advisorNames,
                            "teamAdvisorCount", teamStatistics.totalAdvisors()
                    )
            ));
        }
        addProductMix(recommendations, facts);
        if (!ranking.isEmpty()) {
            var top = ranking.getFirst();
            var supportingFacts = new LinkedHashMap<String, Object>();
            supportingFacts.put("leaderName", top.advisor().advisorName());
            supportingFacts.put("leaderRank", top.rank());
            if (top.achievementPercentage() != null) {
                supportingFacts.put("leaderAchievementPercentage", top.achievementPercentage());
            }
            recommendations.add(new Recommendation(
                    RecommendationType.MAINTAIN_MOMENTUM,
                    RecommendationPriority.LOW,
                    "Share repeatable practices",
                    "Review the leading advisor's current-period approach and identify practices that can be shared with the team.",
                    "The current leaderboard identifies a leading advisor for the active target period.",
                    supportingFacts
            ));
        } else {
            addMomentum(recommendations, facts);
        }
        return prioritized(recommendations);
    }

    private void addTargetRecovery(
            List<Recommendation> recommendations,
            PerformanceFactsService.PerformanceFacts facts
    ) {
        var progress = facts.target().progress();
        SalesForecast forecast = facts.forecast().result();
        boolean forecastRisk = forecast != null
                && forecast.targetAchievementProbability() != null
                && forecast.targetAchievementProbability() < FORECAST_RISK_PROBABILITY;
        if (progress.status() != TargetProgress.Status.AT_RISK && !forecastRisk) {
            return;
        }
        var supportingFacts = new LinkedHashMap<String, Object>();
        supportingFacts.put("targetStatus", progress.status().name());
        supportingFacts.put("targetAmount", progress.targetAmount());
        supportingFacts.put("achievedAmount", progress.achievedAmount());
        supportingFacts.put("remainingAmount", progress.remainingAmount());
        supportingFacts.put("daysRemaining", progress.daysRemaining());
        supportingFacts.put("currentAveragePace", progress.currentAveragePace());
        supportingFacts.put("requiredAveragePace", progress.requiredAveragePace());
        if (forecast != null) {
            supportingFacts.put("predictedEndValue", forecast.predictedEndValue());
            if (forecast.targetAchievementProbability() != null) {
                supportingFacts.put("targetAchievementProbability", forecast.targetAchievementProbability());
            }
            supportingFacts.put("modelVersion", forecast.modelVersion());
        }
        recommendations.add(new Recommendation(
                RecommendationType.TARGET_RECOVERY,
                RecommendationPriority.HIGH,
                "Recover target pace",
                "Prioritize eligible opportunities that can close the remaining target gap during the current period.",
                forecastRisk
                        ? "The trained forecast indicates a target-achievement probability below 50 percent."
                        : "Current confirmed sales are below the expected target pace.",
                supportingFacts
        ));
    }

    private void addProductFocus(
            List<Recommendation> recommendations,
            PerformanceFactsService.PerformanceFacts facts
    ) {
        List<ProductPerformance> products = facts.analytics().productMix().stream()
                .filter(product -> product.transactions() > 0)
                .sorted(Comparator.comparing(ProductPerformance::sales))
                .toList();
        if (products.size() < 2) {
            return;
        }
        ProductPerformance weakest = products.getFirst();
        ProductPerformance strongest = products.getLast();
        if (strongest.sales().signum() <= 0 || weakest.sales().multiply(BigDecimal.valueOf(4)).compareTo(strongest.sales()) >= 0) {
            return;
        }
        recommendations.add(new Recommendation(
                RecommendationType.PRODUCT_FOCUS,
                RecommendationPriority.MEDIUM,
                "Review the weakest product",
                "Review whether eligible opportunities exist for the lowest-performing product before the period closes.",
                "The lowest-performing recorded product has less than one quarter of the sales value of the strongest product.",
                Map.of(
                        "lowestProduct", weakest.productName(),
                        "lowestProductSales", weakest.sales(),
                        "strongestProduct", strongest.productName(),
                        "strongestProductSales", strongest.sales()
                )
        ));
    }

    private void addProductMix(
            List<Recommendation> recommendations,
            PerformanceFactsService.PerformanceFacts facts
    ) {
        List<DimensionPerformance> categories = facts.analytics().productCategoryMix().stream()
                .filter(category -> category.transactions() > 0)
                .sorted(Comparator.comparing(DimensionPerformance::sales))
                .toList();
        if (categories.size() < 2) {
            return;
        }
        DimensionPerformance weakest = categories.getFirst();
        DimensionPerformance strongest = categories.getLast();
        if (strongest.sales().signum() <= 0 || weakest.sales().multiply(BigDecimal.valueOf(4)).compareTo(strongest.sales()) >= 0) {
            return;
        }
        recommendations.add(new Recommendation(
                RecommendationType.IMPROVE_PRODUCT_MIX,
                RecommendationPriority.MEDIUM,
                "Review product mix",
                "Review the low-contribution category and confirm whether the current mix reflects available eligible opportunities.",
                "The lowest recorded category contributes less than one quarter of the sales value of the strongest category.",
                Map.of(
                        "lowestCategory", weakest.value(),
                        "lowestCategorySales", weakest.sales(),
                        "strongestCategory", strongest.value(),
                        "strongestCategorySales", strongest.sales()
                )
        ));
    }

    private void addLevelProgress(
            List<Recommendation> recommendations,
            PerformanceFactsService.PerformanceFacts facts
    ) {
        var progress = facts.gamification();
        if (progress == null || progress.nextLevel() == null || progress.progressPercentage() < CLOSE_TO_LEVEL_PROGRESS_PERCENTAGE) {
            return;
        }
        recommendations.add(new Recommendation(
                RecommendationType.CLOSE_TO_NEXT_LEVEL,
                RecommendationPriority.MEDIUM,
                "Close to " + progress.nextLevel().name(),
                "Keep earning points through eligible confirmed sales to reach the next gamification level.",
                "Lifetime earned points have reached at least 80 percent of the current level interval.",
                Map.of(
                        "currentLevel", progress.currentLevel().name(),
                        "nextLevel", progress.nextLevel().name(),
                        "remainingPoints", progress.remainingPoints(),
                        "progressPercentage", progress.progressPercentage()
                )
        ));
    }

    private void addMomentum(
            List<Recommendation> recommendations,
            PerformanceFactsService.PerformanceFacts facts
    ) {
        BigDecimal growth = facts.analytics().salesGrowthPercentage();
        var status = facts.target().progress().status();
        if ((growth == null || growth.compareTo(STRONG_GROWTH_PERCENTAGE) < 0)
                && status != TargetProgress.Status.AHEAD
                && status != TargetProgress.Status.ACHIEVED) {
            return;
        }
        var supportingFacts = new LinkedHashMap<String, Object>();
        supportingFacts.put("targetStatus", status.name());
        if (growth != null) {
            supportingFacts.put("salesGrowthPercentage", growth);
        }
        recommendations.add(new Recommendation(
                RecommendationType.MAINTAIN_MOMENTUM,
                RecommendationPriority.LOW,
                "Maintain current momentum",
                "Continue the current successful activity while monitoring target pace and product mix.",
                "Verified performance is ahead of target pace, target is achieved or sales growth is at least 20 percent.",
                supportingFacts
        ));
    }

    private List<Recommendation> prioritized(List<Recommendation> recommendations) {
        return recommendations.stream()
                .sorted(Comparator.comparing(Recommendation::priority).thenComparing(recommendation -> recommendation.type().name()))
                .limit(5)
                .toList();
    }
}
