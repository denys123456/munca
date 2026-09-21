package com.championsclub.common.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestClient;

public final class HttpClients {
    private HttpClients() {
    }

    public static RestClient create(String url, int timeoutSeconds, ObjectMapper objectMapper) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
        return RestClient.builder()
                .baseUrl(url)
                .requestFactory(factory)
                .messageConverters(converters -> converters.forEach(converter -> {
                    if (converter instanceof MappingJackson2HttpMessageConverter jacksonConverter) {
                        jacksonConverter.setObjectMapper(objectMapper);
                    }
                }))
                .build();
    }
}
