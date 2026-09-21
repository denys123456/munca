package com.championsclub.recommendations.application;

import com.championsclub.analytics.application.AnalyticsResult;
import com.championsclub.analytics.application.MlForecastClient;
import com.championsclub.analytics.application.ProductPerformance;
import com.championsclub.analytics.application.SalesForecast;
import com.championsclub.analytics.application.SalesTrend;
import com.championsclub.common.application.CachedGeneration.Generated;
import com.championsclub.dashboard.application.PerformanceFactsService;
import com.championsclub.gamification.domain.GamificationLevel;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.recommendations.domain.RecommendationType;
import com.championsclub.rewards.application.RewardRepository;
import com.championsclub.sales.domain.ProductCategory;
import com.championsclub.targets.application.TargetService;
import com.championsclub.targets.domain.TargetProgress;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RecommendationEngineTest {
    private final RecommendationEngine engine = new RecommendationEngine();

    @Test
    void advisorRecommendationsAreDeterministicAndGroundedInFacts() {
        LocalDate reportingDate = LocalDate.of(2026, 9, 15);
        var progress = TargetProgress.calculate(
                BigDecimal.valueOf(1000),
                BigDecimal.valueOf(300),
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30),
                reportingDate
        );
        var target = new TargetService.TargetSnapshot(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), "EUR", progress);
        var analytics = new AnalyticsResult(
                LocalDate.of(2026, 9, 1),
                reportingDate,
                BigDecimal.valueOf(300),
                2,
                BigDecimal.valueOf(150),
                0,
                BigDecimal.ZERO,
                BigDecimal.valueOf(350),
                2,
                BigDecimal.valueOf(-14.29),
                BigDecimal.ZERO,
                List.of(),
                List.of(),
                List.of(),
                List.of(
                        new ProductPerformance(1, "P1", "Low Product", ProductCategory.FINANCING, BigDecimal.valueOf(100), 1, BigDecimal.valueOf(9.09), BigDecimal.valueOf(50)),
                        new ProductPerformance(2, "P2", "High Product", ProductCategory.LEASING, BigDecimal.valueOf(1100), 1, BigDecimal.valueOf(90.91), BigDecimal.valueOf(50))
                ),
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
        var forecast = new SalesForecast(
                BigDecimal.valueOf(650),
                0.20,
                SalesTrend.DOWN,
                0.80,
                List.of(),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(800),
                List.of(),
                "snapshot-test"
        );
        var generated = new Generated<>("AVAILABLE", forecast, Instant.EPOCH, Instant.EPOCH.plusSeconds(3600));
        var gamification = new GamificationProgress(GamificationLevel.SILVER, GamificationLevel.GOLD, 110000, 10000, 83);
        var facts = new PerformanceFactsService.PerformanceFacts(reportingDate, target, analytics, generated, 8000, 110000, gamification);

        var recommendations = engine.advisor(facts, new RewardRepository.RewardSummary(5, 1, 2000));

        assertThat(recommendations).extracting(recommendation -> recommendation.type()).contains(
                RecommendationType.TARGET_RECOVERY,
                RecommendationType.PRODUCT_FOCUS,
                RecommendationType.CLOSE_TO_NEXT_LEVEL,
                RecommendationType.REWARD_OPPORTUNITY
        );
        assertThat(recommendations.getFirst().type()).isEqualTo(RecommendationType.TARGET_RECOVERY);
        assertThat(recommendations.getFirst().supportingFacts()).containsEntry("modelVersion", "snapshot-test");
    }
}
