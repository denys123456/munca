package com.championsclub.ai.application;

import java.util.List;
import java.util.Optional;

public interface AiClient {
    Optional<PerformanceInsight> generate(InsightRequest request);

    /**
     * Optional conversational capability used by the manager statistics assistant.
     * Implementations may return empty when an external AI provider is disabled or unavailable;
     * the frontend keeps a deterministic, JSON-grounded query engine as a fallback.
     */
    default Optional<StatsChatResponse> answerStats(StatsChatRequest request) {
        return Optional.empty();
    }

    record InsightRequest(String audience, Object verifiedFacts) {}

    record StatsChatRequest(String question, List<ChatTurn> history, Object verifiedStats) {}

    record ChatTurn(String role, String content) {}

    record StatsChatResponse(String answer, List<String> usedFields) {}
}
