package com.championsclub.integration;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class SecurityIntegrationTest extends PostgresIntegrationSupport {
    @Test void authenticatesPersistedAccountsAndRevokesTokens() throws Exception {
        var user=newAdvisor();
        String token=login(user.path("email").asText());
        var current=call("GET","/api/me",token,null,200);
        assertThat(current.path("role").asText()).isEqualTo("SALES_ADVISOR");
        assertThat(current.has("passwordHash")).isFalse();
        call("POST","/api/auth/logout",token,null,204);
        call("GET","/api/me",token,null,401);
        call("GET","/api/me",null,null,401);
        call("POST","/api/auth/login",null,Map.of("email",user.path("email").asText(),"password","wrong"),401);
    }
    @Test void rejectsRoleAndDealershipEscalation() throws Exception {
        String jane=login("jane.doe@championsclub.example");
        String manager=login("alex.smith@championsclub.example");
        long other=userId("morgan.lee@championsclub.example");
        call("GET","/api/dashboard/advisor/"+other,jane,null,403);
        call("GET","/api/dashboard/advisor/"+other,manager,null,403);
        call("GET","/api/admin/users",jane,null,403);
        call("GET","/api/admin/health",manager,null,403);
        var advisors=call("GET","/api/advisors?search=Morgan",manager,null,200);
        assertThat(advisors.path("totalElements").asLong()).isZero();
    }
    @Test void disablingAccountInvalidatesExistingTokens() throws Exception {
        var user=newAdvisor();
        String token=login(user.path("email").asText());
        call("PATCH","/api/admin/users/"+user.path("id").asLong()+"/active",admin,Map.of("active",false),200);
        call("GET","/api/me",token,null,401);
    }
    @Test void validatesInputAndEmailUniqueness() throws Exception {
        var invalid=call("POST","/api/admin/users",admin,Map.of("firstName","","lastName","Test","email","bad","role","MANAGER"),400);
        assertThat(invalid.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(invalid.path("fieldErrors").size()).isGreaterThan(0);
        var user=newAdvisor();
        call("POST","/api/admin/users",admin,Map.of("firstName","Test","lastName","Advisor","email",user.path("email").asText(),
                "role","SALES_ADVISOR","dealershipId",north(),"active",true,"password","integration-password-123"),409);
    }
}
