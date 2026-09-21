package com.championsclub.analytics.application;

import com.championsclub.sales.domain.ProductCategory;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface AnalyticsRepository {
    List<MlForecastClient.DailySale> daily(long id, OwnerType type, LocalDate start, LocalDate end);

    PeriodSummary periodSummary(long id, OwnerType type, LocalDate start, LocalDate end);

    List<ProductMix> productMix(long id, OwnerType type, LocalDate start, LocalDate end);

    List<DimensionMix> productCategoryMix(long id, OwnerType type, LocalDate start, LocalDate end);

    List<DimensionMix> powertrainMix(long id, OwnerType type, LocalDate start, LocalDate end);

    List<DimensionMix> vehicleConditionMix(long id, OwnerType type, LocalDate start, LocalDate end);

    List<DimensionMix> customerSegmentMix(long id, OwnerType type, LocalDate start, LocalDate end);

    record PeriodSummary(
            BigDecimal sales,
            long recordedContracts,
            long cancelledContracts,
            BigDecimal averageContractAmount
    ) {
    }

    record ProductMix(
            long productId,
            String productCode,
            String productName,
            ProductCategory category,
            BigDecimal sales,
            long transactions
    ) {
    }

    record DimensionMix(String value, BigDecimal sales, long transactions) {
    }
}
