package com.championsclub.ai.application;

import com.championsclub.common.application.CachedGeneration;
import com.championsclub.recommendations.domain.Recommendation;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class InsightService {
    static final String SOURCE_LLM = "LLM";
    static final String SOURCE_DETERMINISTIC_FALLBACK = "DETERMINISTIC_FALLBACK";

    private final AiClient client;
    private final CachedGeneration cache;
    private final DeterministicInsightFactory fallback;
    private final String provider;
    private final String model;
    private final String generationVersion;

    public InsightService(
            AiClient client,
            CachedGeneration cache,
            DeterministicInsightFactory fallback,
            @Value("${championsclub.ai.provider:DISABLED}") String provider,
            @Value("${championsclub.ai.model:}") String model
    ) {
        this.client = client;
        this.cache = cache;
        this.fallback = fallback;
        this.provider = normalizeProvider(provider);
        this.model = model == null ? "" : model.trim();
        this.generationVersion = this.provider + ":" + this.model + ":grounded-v3-provenance";
    }

    public CachedGeneration.Generated<PerformanceInsight> generate(
            long id,
            String audience,
            Map<String, Object> facts,
            List<Recommendation> recommendations
    ) {
        var groundedInput = new LinkedHashMap<String, Object>();
        groundedInput.put("facts", facts);
        groundedInput.put("deterministicRecommendations", recommendations);
        var request = new AiClient.InsightRequest(audience, groundedInput);

        // Cache only a genuine provider result. If the provider is unavailable, CachedGeneration
        // stores a short-lived negative entry (2 minutes), while the deterministic fallback is
        // returned with explicit provenance and is never mistaken for an LLM response.
        var generated = cache.get(
                "insight:" + audience + ":" + id,
                List.of(generationVersion, request),
                PerformanceInsight.class,
                Duration.ofHours(12),
                () -> client.generate(request)
                        .map(insight -> insight.withGenerationMetadata(SOURCE_LLM, provider, model)),
                false
        );

        if ("AVAILABLE".equals(generated.state()) && generated.result() != null) {
            return generated;
        }

        var deterministic = fallback.create(audience, recommendations)
                .withGenerationMetadata(SOURCE_DETERMINISTIC_FALLBACK, provider, model);
        return new CachedGeneration.Generated<>(
                "AVAILABLE",
                deterministic,
                generated.generatedAt(),
                generated.expiresAt()
        );
    }

    private static String normalizeProvider(String value) {
        if (value == null || value.isBlank()) {
            return "DISABLED";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
