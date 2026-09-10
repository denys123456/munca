package com.championsclub.ai.application;

import java.util.List;
import java.util.Optional;

public interface AiClient {

    Optional<PerformanceInsight> generateAdvisorInsight(InsightRequest request);

    Optional<PerformanceInsight> generateManagerInsight(InsightRequest request);

    record InsightRequest(String audience, List<String> facts) {
    }
}

