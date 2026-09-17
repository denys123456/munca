package com.championsclub.ai.application;
import java.util.Optional;
public interface AiClient {
    Optional<PerformanceInsight> generate(InsightRequest request);
    record InsightRequest(String audience, Object verifiedFacts) {}
}
