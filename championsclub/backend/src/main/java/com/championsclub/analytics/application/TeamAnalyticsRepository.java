package com.championsclub.analytics.application;

import com.championsclub.users.domain.AdvisorType;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TeamAnalyticsRepository {
    Page<AdvisorPerformance> team(
            long dealershipId,
            LocalDate start,
            LocalDate end,
            AdvisorType advisorType,
            Pageable page,
            boolean lowestFirst
    );

    TeamStatistics teamStatistics(long dealershipId, LocalDate start, LocalDate end);

    record AdvisorPerformance(
            long advisorId,
            String advisorName,
            AdvisorType advisorType,
            BigDecimal sales,
            long transactions,
            BigDecimal target,
            int lifetimeEarnedPoints,
            LocalDate lastSaleDate
    ) {
    }

    record TeamStatistics(
            long totalAdvisors,
            long activeAdvisors,
            long salesAdvisors,
            long serviceAdvisors,
            long advisorsWithSales,
            long recordedContracts,
            long cancelledContracts,
            BigDecimal sales,
            BigDecimal averageContractAmount,
            long activeProducts
    ) {
    }
}
