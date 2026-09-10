package com.championsclub.ai.application;

import java.util.List;

public record PerformanceInsight(
        String summary,
        List<String> recommendations,
        boolean isGeneratedByAi
) {

    public static PerformanceInsight unavailable(String fallbackSummary, List<String> fallbackRecommendations) {
        return new PerformanceInsight(fallbackSummary, fallbackRecommendations, false);
    }
}

