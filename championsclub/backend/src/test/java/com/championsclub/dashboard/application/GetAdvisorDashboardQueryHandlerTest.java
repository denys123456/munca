package com.championsclub.dashboard.application;

import com.championsclub.ai.application.AiClient;
import com.championsclub.analytics.application.MlForecastClient;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class GetAdvisorDashboardQueryHandlerTest {

    @Test
    void shouldKeepDashboardAvailableWhenMlAndAiAreUnavailable() {
        GetAdvisorDashboardQueryHandler handler = new GetAdvisorDashboardQueryHandler(
                new DemoDashboardReadRepository(),
                unavailableMlClient(),
                unavailableAiClient()
        );

        AdvisorDashboard dashboard = handler.getAdvisorDashboard(new GetAdvisorDashboardQuery(1L));

        assertThat(dashboard.forecast().isAvailable()).isFalse();
        assertThat(dashboard.insight().isGeneratedByAi()).isFalse();
        assertThat(dashboard.availablePoints()).isEqualTo(1300);
    }

    private MlForecastClient unavailableMlClient() {
        return (entityId, historicalSales, target, forecastHorizonDays) -> Optional.empty();
    }

    private AiClient unavailableAiClient() {
        return new AiClient() {
            @Override
            public Optional<com.championsclub.ai.application.PerformanceInsight> generateAdvisorInsight(InsightRequest request) {
                return Optional.empty();
            }

            @Override
            public Optional<com.championsclub.ai.application.PerformanceInsight> generateManagerInsight(InsightRequest request) {
                return Optional.empty();
            }
        };
    }

    private static class DemoDashboardReadRepository implements DashboardReadRepository {

        @Override
        public AdvisorDashboardData findAdvisorDashboardData(Long advisorId) {
            return new AdvisorDashboardData(
                    "Jane Doe",
                    1L,
                    new BigDecimal("45000"),
                    new BigDecimal("90000"),
                    1300,
                    List.of("Silver Momentum"),
                    List.of(new BigDecimal("40000"), new BigDecimal("45000"))
            );
        }

        @Override
        public ManagerDashboardData findManagerDashboardData(Long dealershipId) {
            return null;
        }

        @Override
        public List<LeaderboardEntry> findLeaderboardForDealership(Long dealershipId) {
            return List.of();
        }

        @Override
        public List<DashboardAlert> findUnreadAlerts(Long recipientId) {
            return List.of();
        }

        @Override
        public List<EmployeeAttentionItem> findEmployeesNeedingAttention(Long dealershipId) {
            return List.of();
        }
    }
}

