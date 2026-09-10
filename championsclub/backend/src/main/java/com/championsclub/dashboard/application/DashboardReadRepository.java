package com.championsclub.dashboard.application;

import java.math.BigDecimal;
import java.util.List;

public interface DashboardReadRepository {

    AdvisorDashboardData findAdvisorDashboardData(Long advisorId);

    ManagerDashboardData findManagerDashboardData(Long dealershipId);

    List<LeaderboardEntry> findLeaderboardForDealership(Long dealershipId);

    List<DashboardAlert> findUnreadAlerts(Long recipientId);

    List<EmployeeAttentionItem> findEmployeesNeedingAttention(Long dealershipId);

    record AdvisorDashboardData(
            String advisorName,
            Long dealershipId,
            BigDecimal monthSales,
            BigDecimal monthTarget,
            int availablePoints,
            List<String> achievements,
            List<BigDecimal> historicalSales
    ) {
    }

    record ManagerDashboardData(
            String dealershipName,
            BigDecimal monthSales,
            BigDecimal monthTarget,
            List<BigDecimal> historicalSales
    ) {
    }
}

