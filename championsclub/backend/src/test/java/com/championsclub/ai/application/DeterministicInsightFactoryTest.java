package com.championsclub.ai.application;

import com.championsclub.recommendations.domain.Recommendation;
import com.championsclub.recommendations.domain.RecommendationPriority;
import com.championsclub.recommendations.domain.RecommendationType;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DeterministicInsightFactoryTest {
    private final DeterministicInsightFactory factory = new DeterministicInsightFactory();

    @Test
    void fallbackUsesTheDeterministicRecommendation() {
        var recommendation = new Recommendation(
                RecommendationType.TARGET_RECOVERY,
                RecommendationPriority.HIGH,
                "Recover target pace",
                "Prioritize eligible opportunities.",
                "Current confirmed sales are below expected target pace.",
                Map.of("targetStatus", "AT_RISK")
        );

        var result = factory.create("ADVISOR", List.of(recommendation));

        assertThat(result.valid()).isTrue();
        assertThat(result.risk()).isEqualTo(recommendation.reason());
        assertThat(result.recommendedAction()).isEqualTo(recommendation.action());
    }
}
