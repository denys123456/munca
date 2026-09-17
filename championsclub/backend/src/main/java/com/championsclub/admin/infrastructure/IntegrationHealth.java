package com.championsclub.admin.infrastructure;
import com.championsclub.admin.application.*;
import com.championsclub.common.infrastructure.HttpClients;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
@Component
class IntegrationHealth implements SystemHealth {
    private final SystemQueries queries;
    private final RestClient ml;
    private final boolean aiConfigured;
    IntegrationHealth(SystemQueries queries,@Value("${championsclub.ml.base-url}") String mlUrl,
                      @Value("${championsclub.ai.api-key:}") String key,@Value("${championsclub.ai.model:}") String model,
                      @Value("${championsclub.ai.provider:DISABLED}") String provider) {
        this.queries=queries; this.ml=HttpClients.create(mlUrl,2);
        this.aiConfigured=!"DISABLED".equals(provider) && !key.isBlank() && !model.isBlank();
    }
    public Health status() {
        String mlStatus;
        try {
            Map<?,?> response=ml.get().uri("/health").retrieve().body(Map.class);
            mlStatus=response != null && "UP".equals(response.get("status")) ? "UP" : "UNAVAILABLE";
        } catch (RestClientException exception) { mlStatus="UNAVAILABLE"; }
        return new Health("UP",queries.databaseAvailable() ? "UP" : "UNAVAILABLE",mlStatus,
                aiConfigured ? "CONFIGURED_NOT_PROBED" : "NOT_CONFIGURED");
    }
}
