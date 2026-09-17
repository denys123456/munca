package com.championsclub.integration;
import com.championsclub.alerts.application.PerformanceRefresh;
import com.championsclub.users.application.UserStore;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import static org.assertj.core.api.Assertions.*;
class DashboardIntegrationTest extends PostgresIntegrationSupport {
    @Autowired PerformanceRefresh refresh;
    @Autowired UserStore users;
    @Test void dashboardsSurviveUnavailableDependenciesAndRemainScoped() throws Exception {
        long jane=userId("jane.doe@championsclub.example");
        long manager=userId("alex.smith@championsclub.example");
        String advisorToken=login("jane.doe@championsclub.example");
        String managerToken=login("alex.smith@championsclub.example");
        var advisor=call("GET","/api/dashboard/advisor/"+jane,advisorToken,null,200);
        assertThat(advisor.path("performance").path("forecast").path("state").asText()).isEqualTo("UNAVAILABLE");
        assertThat(advisor.path("insight").path("state").asText()).isEqualTo("UNAVAILABLE");
        assertThat(advisor.path("performance").path("availablePoints").asInt()).isPositive();
        var team=call("GET","/api/dashboard/manager/"+manager+"/dealership/"+north(),managerToken,null,200);
        assertThat(team.path("dealership").path("id").asLong()).isEqualTo(north());
        call("GET","/api/dashboard/advisor/"+jane,managerToken,null,200);
        var stats=call("GET","/api/dashboard/admin",admin,null,200);
        assertThat(stats.path("health").path("database").asText()).isEqualTo("UP");
        assertThat(stats.path("activity").path("sales").asLong()).isGreaterThan(500);
    }
    @Test void leaderboardIsSortedAndPaged() throws Exception {
        LocalDate start=LocalDate.now().withDayOfMonth(1);
        String path="/api/leaderboard?dealershipId="+north()+"&start="+start+"&end="+start.plusMonths(1).minusDays(1)+"&size=2";
        var first=call("GET",path,admin,null,200);
        var second=call("GET",path+"&page=1",admin,null,200);
        assertThat(first.path("content").size()).isEqualTo(2);
        assertThat(second.path("content").get(0).path("rank").asInt()).isEqualTo(3);
        assertThat(first.path("content").get(0).path("advisor").path("sales").decimalValue())
                .isGreaterThanOrEqualTo(first.path("content").get(1).path("advisor").path("sales").decimalValue());
    }
    @Test void generatesDeduplicatedAlertsAndMarksRead() throws Exception {
        long id=userId("jane.doe@championsclub.example");
        refresh.user(users.get(id));
        long before=database.queryForObject("select count(*) from alerts where recipient_id=?",Long.class,id);
        refresh.user(users.get(id));
        assertThat(database.queryForObject("select count(*) from alerts where recipient_id=?",Long.class,id)).isEqualTo(before);
        String token=login("jane.doe@championsclub.example");
        var alerts=call("GET","/api/alerts",token,null,200);
        assertThat(alerts.path("totalElements").asLong()).isPositive();
        long alert=alerts.path("content").get(0).path("id").asLong();
        assertThat(call("POST","/api/alerts/"+alert+"/read",token,null,200).path("readAt").isNull()).isFalse();
        call("POST","/api/alerts/"+alert+"/read",login("emma.taylor@championsclub.example"),null,403);
    }
    @Test void targetOverlapAndAdminConfigurationAreValidated() throws Exception {
        var advisor=newAdvisor();
        LocalDate start=LocalDate.now().withDayOfMonth(1);
        var target=Map.of("ownerId",advisor.path("id").asLong(),"ownerType","ADVISOR","periodStart",start.toString(),
                "periodEnd",start.plusMonths(1).minusDays(1).toString(),"targetAmount",10000,"currency","EUR","active",true);
        call("POST","/api/targets",admin,target,201);
        call("POST","/api/targets",admin,target,409);
        call("PUT","/api/admin/gamification",admin,Map.of("bronze",0,"silver",2000,"gold",1000),400);
        assertThat(call("GET","/api/audit?size=1",admin,null,200).path("totalElements").asLong()).isPositive();
        assertThat(call("GET","/api/admin/products?search=FINANCING&size=1",admin,null,200).path("totalElements").asLong()).isEqualTo(1);
    }
}
