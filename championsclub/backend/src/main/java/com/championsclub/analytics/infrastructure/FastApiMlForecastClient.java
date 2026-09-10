package com.championsclub.analytics.infrastructure;

import com.championsclub.analytics.application.MlForecastClient;
import com.championsclub.analytics.application.SalesForecast;
import com.championsclub.analytics.application.SalesTrend;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
class FastApiMlForecastClient implements MlForecastClient {

    private final RestClient restClient;

    FastApiMlForecastClient(@Value("${championsclub.ml.base-url}") String mlBaseUrl) {
        this.restClient = RestClient.builder().baseUrl(mlBaseUrl).build();
    }

    @Override
    public Optional<SalesForecast> forecastSales(Long entityId, List<BigDecimal> historicalSales, BigDecimal target, int forecastHorizonDays) {
        try {
            MlForecastResponse response = restClient.post()
                    .uri("/forecast")
                    .body(new MlForecastRequest(entityId, historicalSales, target, forecastHorizonDays))
                    .retrieve()
                    .body(MlForecastResponse.class);
            return validateResponse(response);
        } catch (RestClientException exception) {
            return Optional.empty();
        }
    }

    private Optional<SalesForecast> validateResponse(MlForecastResponse response) {
        if (response == null || response.predictedSales() == null || response.confidence() < 0 || response.confidence() > 1) {
            return Optional.empty();
        }
        if (response.targetAchievementProbability() < 0 || response.targetAchievementProbability() > 1) {
            return Optional.empty();
        }
        return Optional.of(new SalesForecast(
                response.predictedSales(),
                response.targetAchievementProbability(),
                response.trend(),
                response.confidence(),
                true
        ));
    }

    private record MlForecastRequest(Long entityId, List<BigDecimal> historicalSales, BigDecimal target, int forecastHorizonDays) {
    }

    private record MlForecastResponse(BigDecimal predictedSales, double targetAchievementProbability, SalesTrend trend, double confidence) {
    }
}

