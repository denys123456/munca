package com.championsclub.analytics.infrastructure;
import com.championsclub.analytics.application.*;
import com.championsclub.common.infrastructure.HttpClients;
import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
@Component
public class FastApiMlForecastClient implements MlForecastClient {
    private final RestClient http;
    public FastApiMlForecastClient(@Value("${championsclub.ml.base-url}") String url,
                                   @Value("${championsclub.ml.timeout-seconds:5}") int timeout) {
        this.http=HttpClients.create(url, timeout);
    }
    public Optional<SalesForecast> forecast(ForecastRequest request) {
        try {
            SalesForecast result=http.post().uri("/forecast").body(request).retrieve().body(SalesForecast.class);
            if (!valid(result, request)) return Optional.empty();
            return Optional.of(result);
        } catch (RestClientException | IllegalArgumentException exception) { return Optional.empty(); }
    }
    private boolean valid(SalesForecast r, ForecastRequest request) {
        if (r == null || r.predictedEndValue() == null || r.predictedEndValue().signum() < 0 || r.trend() == null
                || !unit(r.confidence()) || r.targetAchievementProbability() != null && !unit(r.targetAchievementProbability())
                || r.lowerBound() == null || r.upperBound() == null || r.lowerBound().signum() < 0
                || r.lowerBound().compareTo(r.predictedEndValue()) > 0 || r.upperBound().compareTo(r.predictedEndValue()) < 0
                || r.forecastPoints() == null || r.anomalies() == null || r.modelVersion() == null) return false;
        long days=ChronoUnit.DAYS.between(request.asOf(), request.periodEnd());
        if (r.forecastPoints().size() != days) return false;
        BigDecimal total=request.historicalSales().stream().filter(p -> !p.date().isBefore(request.periodStart()))
                .map(DailySale::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        for (int index=0; index<r.forecastPoints().size(); index++) {
            var point=r.forecastPoints().get(index);
            if (point.amount() == null || point.amount().signum() < 0 || !request.asOf().plusDays(index+1).equals(point.date())) return false;
            total=total.add(point.amount());
        }
        if (total.subtract(r.predictedEndValue()).abs().compareTo(new BigDecimal("0.01")) > 0) return false;
        return r.anomalies().stream().allMatch(a -> a.date() != null && !a.date().isAfter(request.asOf())
                && a.amount() != null && a.amount().signum() >= 0 && Double.isFinite(a.score()) && a.score() >= 0);
    }
    private boolean unit(double value) { return Double.isFinite(value) && value >= 0 && value <= 1; }
}
