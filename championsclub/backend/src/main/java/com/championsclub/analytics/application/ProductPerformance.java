package com.championsclub.analytics.application;

import com.championsclub.sales.domain.ProductCategory;
import java.math.BigDecimal;

public record ProductPerformance(
        long productId,
        String productCode,
        String productName,
        ProductCategory category,
        BigDecimal sales,
        long transactions,
        BigDecimal salesSharePercentage,
        BigDecimal transactionSharePercentage
) {
}
