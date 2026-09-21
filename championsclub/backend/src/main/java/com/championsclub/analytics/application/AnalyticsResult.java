package com.championsclub.analytics.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AnalyticsResult(
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal sales,
        long recordedContracts,
        BigDecimal averageContractAmount,
        long cancelledContracts,
        BigDecimal cancellationRatePercentage,
        BigDecimal previousPeriodSales,
        long previousPeriodRecordedContracts,
        BigDecimal salesGrowthPercentage,
        BigDecimal contractGrowthPercentage,
        List<MlForecastClient.DailySale> dailySales,
        List<MlForecastClient.DailySale> weeklySales,
        List<MlForecastClient.DailySale> monthlySales,
        List<ProductPerformance> productMix,
        List<DimensionPerformance> productCategoryMix,
        List<DimensionPerformance> powertrainMix,
        List<DimensionPerformance> vehicleConditionMix,
        List<DimensionPerformance> customerSegmentMix
) {
}
