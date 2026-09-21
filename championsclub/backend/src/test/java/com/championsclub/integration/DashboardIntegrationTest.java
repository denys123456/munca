package com.championsclub.integration;

import com.championsclub.alerts.application.PerformanceRefresh;
import com.championsclub.users.application.UserStore;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

class DashboardIntegrationTest extends PostgresIntegrationSupport {
    @Autowired
    PerformanceRefresh refresh;

    @Autowired
    UserStore users;

    @Test
    void dashboardsSurviveUnavailableDependenciesAndRemainScoped() throws Exception {
        long jane = userId("jane.doe@championsclub.example");
        long manager = userId("alex.smith@championsclub.example");
        String advisorToken = login("jane.doe@championsclub.example");

        var advisorDashboard = call("GET", "/api/dashboard/advisor/" + jane, advisorToken, null, 200);

        assertThat(advisorDashboard.path("performance").path("forecast").path("state").asText()).isEqualTo("UNAVAILABLE");
        assertThat(advisorDashboard.path("insight").path("state").asText()).isEqualTo("AVAILABLE");
        assertThat(advisorDashboard.path("insight").path("result").path("recommendedAction").asText()).isNotBlank();
        assertThat(advisorDashboard.path("recommendations").isArray()).isTrue();
        assertThat(advisorDashboard.path("performance").path("availablePoints").asInt()).isPositive();
        assertThat(advisorDashboard.path("performance").path("lifetimeEarnedPoints").asInt()).isPositive();
        assertThat(advisorDashboard.path("identity").path("advisorType").asText()).isEqualTo("SALES");

        var managerDashboard = call(
                "GET",
                "/api/dashboard/manager/" + manager + "/dealership/" + north(),
                managerToken,
                null,
                200
        );
        assertThat(managerDashboard.path("dealership").path("id").asLong()).isEqualTo(north());

        call("GET", "/api/dashboard/advisor/" + jane, managerToken, null, 200);
        call(
                "GET",
                "/api/dashboard/manager/" + manager + "/dealership/" + south(),
                managerToken,
                null,
                403
        );
    }

    @Test
    void leaderboardIsSortedByTargetAchievementAndPaged() throws Exception {
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        String path = "/api/leaderboard?dealershipId=" + north()
                + "&start=" + start
                + "&end=" + start.plusMonths(1).minusDays(1)
                + "&size=2";

        var firstPage = call("GET", path, managerToken, null, 200);
        var secondPage = call("GET", path + "&page=1", managerToken, null, 200);

        assertThat(firstPage.path("content").size()).isEqualTo(2);
        assertThat(secondPage.path("content").get(0).path("rank").asInt()).isEqualTo(3);
        assertThat(firstPage.path("content").get(0).path("achievementPercentage").decimalValue())
                .isGreaterThanOrEqualTo(firstPage.path("content").get(1).path("achievementPercentage").decimalValue());
    }

    @Test
    void generatesDeduplicatedAlertsAndMarksRead() throws Exception {
        long advisorId = userId("jane.doe@championsclub.example");
        refresh.user(users.get(advisorId));
        long before = database.queryForObject(
                "select count(*) from alerts where recipient_id = ?",
                Long.class,
                advisorId
        );

        refresh.user(users.get(advisorId));

        assertThat(database.queryForObject(
                "select count(*) from alerts where recipient_id = ?",
                Long.class,
                advisorId
        )).isEqualTo(before);

        String token = login("jane.doe@championsclub.example");
        var alerts = call("GET", "/api/alerts", token, null, 200);
        assertThat(alerts.path("totalElements").asLong()).isPositive();

        long alertId = alerts.path("content").get(0).path("id").asLong();
        assertThat(call("POST", "/api/alerts/" + alertId + "/read", token, null, 200).path("readAt").isNull()).isFalse();
        call("POST", "/api/alerts/" + alertId + "/read", login("emma.taylor@championsclub.example"), null, 403);
    }

    @Test
    void managerCannotCreateOverlappingAdvisorTargets() throws Exception {
        var advisor = newAdvisor();
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        var target = Map.of(
                "ownerId", advisor.id(),
                "ownerType", "ADVISOR",
                "periodStart", start.toString(),
                "periodEnd", start.plusMonths(1).minusDays(1).toString(),
                "targetAmount", 12000,
                "currency", "EUR",
                "active", true
        );

        call("POST", "/api/targets", managerToken, target, 409);
    }
}
