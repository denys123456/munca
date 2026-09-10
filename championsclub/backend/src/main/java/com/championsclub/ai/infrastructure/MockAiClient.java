package com.championsclub.ai.infrastructure;

import com.championsclub.ai.application.AiClient;
import com.championsclub.ai.application.PerformanceInsight;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
class MockAiClient implements AiClient {

    private final String provider;

    MockAiClient(@Value("${championsclub.ai.provider}") String provider) {
        this.provider = provider;
    }

    @Override
    public Optional<PerformanceInsight> generateAdvisorInsight(InsightRequest request) {
        return Optional.of(new PerformanceInsight(
                "Eligible financial products are driving steady progress this month.",
                List.of("Prioritise customers with active vehicle finance renewals.", "Protect conversion quality by focusing on products with clear customer value."),
                isExternalProviderConfigured()
        ));
    }

    @Override
    public Optional<PerformanceInsight> generateManagerInsight(InsightRequest request) {
        return Optional.of(new PerformanceInsight(
                "The dealership is ahead of last month but attention is needed for advisors below target pace.",
                List.of("Schedule focused coaching for advisors below 70 percent target progress.", "Share the top performer sales approach in the next team meeting."),
                isExternalProviderConfigured()
        ));
    }

    private boolean isExternalProviderConfigured() {
        return !"MOCK".equalsIgnoreCase(provider);
    }
}

