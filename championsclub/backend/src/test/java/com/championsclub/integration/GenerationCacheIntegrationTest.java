package com.championsclub.integration;
import com.championsclub.common.application.CachedGeneration;
import com.championsclub.ai.application.PerformanceInsight;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import static org.assertj.core.api.Assertions.*;
class GenerationCacheIntegrationTest extends PostgresIntegrationSupport {
    @Autowired CachedGeneration cache;
    @Test void cachesResultsAndInvalidatesChangedFactsAndExpiry() {
        String key="test:"+UUID.randomUUID();
        AtomicInteger calls=new AtomicInteger();
        Supplier<Optional<PerformanceInsight>> generate=() -> {
            calls.incrementAndGet();
            return Optional.of(new PerformanceInsight("Summary","Change","Meaning","Risk","Opportunity","Action"));
        };
        cache.get(key,Map.of("sales",100),PerformanceInsight.class,Duration.ofHours(1),generate,false);
        var cached=cache.get(key,Map.of("sales",100),PerformanceInsight.class,Duration.ofHours(1),generate,false);
        assertThat(cached.state()).isEqualTo("AVAILABLE");
        assertThat(calls).hasValue(1);
        cache.get(key,Map.of("sales",200),PerformanceInsight.class,Duration.ofHours(1),generate,false);
        assertThat(calls).hasValue(2);
        database.update("update generated_results set expires_at=now()-interval '1 second' where cache_key=?",key);
        cache.get(key,Map.of("sales",200),PerformanceInsight.class,Duration.ofHours(1),generate,false);
        assertThat(calls).hasValue(3);
    }
    @Test void cachesFailureWithoutInventingAnInsight() {
        String key="test:"+UUID.randomUUID();
        AtomicInteger calls=new AtomicInteger();
        Supplier<Optional<PerformanceInsight>> generate=() -> { calls.incrementAndGet(); return Optional.empty(); };
        cache.get(key,Map.of("sales",100),PerformanceInsight.class,Duration.ofHours(1),generate,false);
        var result=cache.get(key,Map.of("sales",100),PerformanceInsight.class,Duration.ofHours(1),generate,false);
        assertThat(calls).hasValue(1);
        assertThat(result.result()).isNull();
        assertThat(result.state()).isEqualTo("UNAVAILABLE");
    }
}
