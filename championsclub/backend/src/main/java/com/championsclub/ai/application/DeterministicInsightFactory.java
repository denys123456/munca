package com.championsclub.ai.application;

import com.championsclub.recommendations.domain.Recommendation;
import com.championsclub.recommendations.domain.RecommendationPriority;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DeterministicInsightFactory {
    public PerformanceInsight create(String audience, List<Recommendation> recommendations) {
        Recommendation first = recommendations.isEmpty() ? null : recommendations.getFirst();
        Recommendation risk = recommendations.stream()
                .filter(recommendation -> recommendation.priority() == RecommendationPriority.HIGH)
                .findFirst()
                .orElse(null);
        Recommendation opportunity = recommendations.stream()
                .filter(recommendation -> recommendation.priority() != RecommendationPriority.HIGH)
                .findFirst()
                .orElse(first);
        String subject = "MANAGER".equals(audience) ? "dealership" : "advisor";
        return new PerformanceInsight(
                "Verified " + subject + " performance facts are available for the active reporting period.",
                "Current-period analytics are compared with the preceding equal-length period in the verified dashboard facts.",
                "Target pace, forecast output, points and deterministic recommendations identify where attention is required.",
                risk == null ? "No high-priority deterministic risk is currently surfaced." : risk.reason(),
                opportunity == null ? "Continue monitoring target pace and the verified performance mix." : opportunity.reason(),
                first == null ? "Continue monitoring the verified dashboard facts." : first.action()
        );
    }
}
