package com.championsclub.integration;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AnalyticsFoundationIntegrationTest extends PostgresIntegrationSupport {
    @Test
    void managerAnalyticsExposeTeamStatisticsAndDataBreakdowns() throws Exception {
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        LocalDate end = LocalDate.now();
        String analyticsPath = "/api/analytics?subjectId=" + north()
                + "&subjectType=DEALERSHIP&start=" + start
                + "&end=" + end;

        var analytics = call("GET", analyticsPath, managerToken, null, 200);

        assertThat(analytics.path("recordedContracts").asLong()).isPositive();
        assertThat(analytics.path("sales").decimalValue()).isPositive();
        assertThat(analytics.path("averageContractAmount").decimalValue()).isPositive();
        assertThat(analytics.path("productMix").isArray()).isTrue();
        assertThat(analytics.path("productMix").size()).isPositive();
        assertThat(analytics.path("productCategoryMix").isArray()).isTrue();
        assertThat(analytics.path("productCategoryMix").size()).isPositive();
        assertThat(analytics.path("powertrainMix").isArray()).isTrue();
        assertThat(analytics.path("vehicleConditionMix").isArray()).isTrue();
        assertThat(analytics.path("customerSegmentMix").isArray()).isTrue();

        var statistics = call(
                "GET",
                "/api/analytics/team-statistics?dealershipId=" + north() + "&start=" + start + "&end=" + end,
                managerToken,
                null,
                200
        );

        assertThat(statistics.path("totalAdvisors").asLong()).isEqualTo(3);
        assertThat(statistics.path("activeAdvisors").asLong()).isEqualTo(3);
        assertThat(statistics.path("salesAdvisors").asLong()).isEqualTo(2);
        assertThat(statistics.path("serviceAdvisors").asLong()).isEqualTo(1);
        assertThat(statistics.path("advisorsWithSales").asLong()).isPositive();
        assertThat(statistics.path("activeProducts").asLong()).isEqualTo(5);
    }

    @Test
    void advisorLeaderboardIsRestrictedToTheAdvisorsCohort() throws Exception {
        long jane = userId("jane.doe@championsclub.example");
        String token = login("jane.doe@championsclub.example");
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        var leaderboard = call(
                "GET",
                "/api/leaderboard?dealershipId=" + north() + "&start=" + start + "&end=" + end,
                token,
                null,
                200
        );

        assertThat(leaderboard.path("content").size()).isPositive();
        leaderboard.path("content").forEach(row ->
                assertThat(row.path("advisor").path("advisorType").asText()).isEqualTo("SALES")
        );

        call(
                "GET",
                "/api/leaderboard?dealershipId=" + north() + "&start=" + start + "&end=" + end + "&advisorType=SERVICE",
                token,
                null,
                403
        );

        var profile = call("GET", "/api/advisors/" + jane + "/profile", token, null, 200);
        assertThat(profile.path("cohortPosition").path("rank").asInt()).isPositive();
        assertThat(profile.path("cohortPosition").path("cohortSize").asLong()).isEqualTo(2);
    }

    @Test
    void advisorProfileContainsLifetimeAndCurrentPerformanceAndRemainsScoped() throws Exception {
        long jane = userId("jane.doe@championsclub.example");
        long emma = userId("emma.taylor@championsclub.example");
        String advisorToken = login("jane.doe@championsclub.example");

        var profile = call("GET", "/api/advisors/" + jane + "/profile", advisorToken, null, 200);

        assertThat(profile.path("identity").path("advisorType").asText()).isEqualTo("SALES");
        assertThat(profile.path("dealership").path("id").asLong()).isEqualTo(north());
        assertThat(profile.path("lifetime").path("recordedContracts").asLong()).isPositive();
        assertThat(profile.path("lifetime").path("sales").decimalValue()).isPositive();
        assertThat(profile.path("lifetime").path("strongestProductName").asText()).isNotBlank();
        assertThat(profile.path("currentPeriod").path("recordedContracts").asLong()).isPositive();
        assertThat(profile.path("availablePoints").asInt()).isPositive();
        assertThat(profile.path("lifetimeEarnedPoints").asInt()).isPositive();

        call("GET", "/api/advisors/" + emma + "/profile", advisorToken, null, 403);
        call("GET", "/api/advisors/" + emma + "/profile", managerToken, null, 200);
    }

    @Test
    void advisorsCannotReadManagerTeamStatistics() throws Exception {
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        String advisorToken = login("jane.doe@championsclub.example");
        call(
                "GET",
                "/api/analytics/team-statistics?dealershipId=" + north() + "&start=" + start + "&end=" + LocalDate.now(),
                advisorToken,
                null,
                403
        );
    }
}
