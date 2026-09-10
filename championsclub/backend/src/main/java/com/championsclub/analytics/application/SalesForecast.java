package com.championsclub.analytics.application;

import java.math.BigDecimal;

public record SalesForecast(
        BigDecimal predictedSales,
        double targetAchievementProbability,
        SalesTrend trend,
        double confidence,
        boolean isAvailable
) {

    public static SalesForecast unavailable() {
        return new SalesForecast(BigDecimal.ZERO, 0, SalesTrend.STABLE, 0, false);
    }
}

