package com.championsclub.analytics.application;

import com.championsclub.sales.domain.ProductCategory;
import com.championsclub.users.domain.AdvisorType;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface AdvisorAnalyticsRepository {
    AdvisorLifetimeStatistics lifetime(long advisorId);

    AdvisorPosition position(
            long advisorId,
            long dealershipId,
            AdvisorType advisorType,
            LocalDate start,
            LocalDate end
    );

    record AdvisorLifetimeStatistics(
            BigDecimal sales,
            long recordedContracts,
            long cancelledContracts,
            BigDecimal averageContractAmount,
            LocalDate firstSaleDate,
            LocalDate lastSaleDate,
            Long strongestProductId,
            String strongestProductName,
            ProductCategory strongestProductCategory
    ) {
    }

    record AdvisorPosition(int rank, long cohortSize, BigDecimal achievementPercentage) {
    }
}
