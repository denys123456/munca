package com.championsclub.recommendations.domain;

import java.util.LinkedHashMap;
import java.util.Map;

public record Recommendation(
        RecommendationType type,
        RecommendationPriority priority,
        String title,
        String action,
        String reason,
        Map<String, Object> supportingFacts
) {
    public Recommendation {
        if (type == null || priority == null) {
            throw new IllegalArgumentException("Recommendation type and priority are required.");
        }
        if (title == null || title.isBlank() || action == null || action.isBlank() || reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Recommendation text is required.");
        }
        supportingFacts = Map.copyOf(new LinkedHashMap<>(supportingFacts));
    }
}
