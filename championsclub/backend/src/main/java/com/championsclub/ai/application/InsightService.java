package com.championsclub.ai.application;
import com.championsclub.common.application.CachedGeneration;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
@Service
public class InsightService {
    private final AiClient client;
    private final CachedGeneration cache;
    private final String generationVersion;
    public InsightService(AiClient client, CachedGeneration cache,
                          @Value("${championsclub.ai.provider:DISABLED}") String provider,
                          @Value("${championsclub.ai.model:}") String model) {
        this.client=client; this.cache=cache; this.generationVersion=provider+":"+model+":v1";
    }
    public CachedGeneration.Generated<PerformanceInsight> generate(long id, String audience, Object facts) {
        var request=new AiClient.InsightRequest(audience,facts);
        return cache.get("insight:"+audience+":"+id, java.util.List.of(generationVersion,request), PerformanceInsight.class,
                Duration.ofHours(12),() -> client.generate(request),false);
    }
}
