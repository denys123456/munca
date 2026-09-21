package com.championsclub.analytics.application;

import java.math.BigDecimal;

public record DimensionPerformance(
        String value,
        BigDecimal sales,
        long transactions,
        BigDecimal transactionSharePercentage
) {
}
