package com.championsclub.analytics.application;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
public record SalesForecast(BigDecimal predictedEndValue, Double targetAchievementProbability, SalesTrend trend,
                            double confidence, List<MlForecastClient.DailySale> forecastPoints,
                            BigDecimal lowerBound, BigDecimal upperBound, List<Anomaly> anomalies, String modelVersion) {
    public record Anomaly(LocalDate date, BigDecimal amount, double score) {}
}
