package com.championsclub.ai.application;

import com.championsclub.common.application.CachedGeneration;
import com.championsclub.common.application.ResultCache;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InsightServiceTest {
    @Test
    void providerResultCarriesExplicitLlmProvenanceAndIsCached() {
        var client = new CountingClient(Optional.of(sampleInsight()));
        var service = service(client, "openai", "test-model");

        var first = service.generate(7L, "ADVISOR", Map.of("sales", 10000), List.of());
        var second = service.generate(7L, "ADVISOR", Map.of("sales", 10000), List.of());

        assertThat(first.state()).isEqualTo("AVAILABLE");
        assertThat(first.result().generationSource()).isEqualTo("LLM");
        assertThat(first.result().provider()).isEqualTo("OPENAI");
        assertThat(first.result().model()).isEqualTo("test-model");
        assertThat(second.result()).isEqualTo(first.result());
        assertThat(client.calls).isEqualTo(1);
    }

    @Test
    void providerFailureReturnsExplicitShortLivedDeterministicFallback() {
        var client = new CountingClient(Optional.empty());
        var service = service(client, "OPENAI", "test-model");

        var first = service.generate(9L, "MANAGER", Map.of("sales", 10000), List.of());
        var second = service.generate(9L, "MANAGER", Map.of("sales", 10000), List.of());

        assertThat(first.state()).isEqualTo("AVAILABLE");
        assertThat(first.result().generationSource()).isEqualTo("DETERMINISTIC_FALLBACK");
        assertThat(first.result().provider()).isEqualTo("OPENAI");
        assertThat(first.result().model()).isEqualTo("test-model");
        assertThat(Duration.between(first.generatedAt(), first.expiresAt())).isEqualTo(Duration.ofMinutes(2));
        assertThat(second.result().generationSource()).isEqualTo("DETERMINISTIC_FALLBACK");
        assertThat(client.calls).isEqualTo(1);
    }

    private InsightService service(AiClient client, String provider, String model) {
        var cache = new CachedGeneration(new MemoryResultCache(), new ObjectMapper());
        return new InsightService(client, cache, new DeterministicInsightFactory(), provider, model);
    }

    private PerformanceInsight sampleInsight() {
        return new PerformanceInsight(
                "Sales are recorded.",
                "Sales increased.",
                "Target progress improved.",
                "Forecast is unavailable.",
                "Review eligible products.",
                "Review the current target."
        );
    }

    private static final class CountingClient implements AiClient {
        private final Optional<PerformanceInsight> response;
        private int calls;

        private CountingClient(Optional<PerformanceInsight> response) {
            this.response = response;
        }

        @Override
        public Optional<PerformanceInsight> generate(InsightRequest request) {
            calls++;
            return response;
        }
    }

    private static final class MemoryResultCache implements ResultCache {
        private final Map<String, Stored> entries = new HashMap<>();

        @Override
        public Optional<Entry> find(String key, String sourceHash, Instant now) {
            var stored = entries.get(key);
            if (stored == null || !stored.sourceHash.equals(sourceHash) || !stored.entry.expiresAt().isAfter(now)) {
                return Optional.empty();
            }
            return Optional.of(stored.entry);
        }

        @Override
        public void save(String key, String sourceHash, String json, Instant generatedAt, Instant expiresAt) {
            entries.put(key, new Stored(sourceHash, new Entry(json, generatedAt, expiresAt)));
        }

        private record Stored(String sourceHash, Entry entry) {
        }
    }
}
