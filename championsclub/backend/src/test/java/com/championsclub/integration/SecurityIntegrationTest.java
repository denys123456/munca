package com.championsclub.integration;

import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityIntegrationTest extends PostgresIntegrationSupport {
    @Test
    void authenticatesPersistedAdvisorAndRevokesTokens() throws Exception {
        var advisor = newAdvisor();
        String token = login(advisor.email());

        var current = call("GET", "/api/me", token, null, 200);

        assertThat(current.path("role").asText()).isEqualTo("ADVISOR");
        assertThat(current.path("advisorType").asText()).isEqualTo("SALES");
        assertThat(current.has("passwordHash")).isFalse();

        call("POST", "/api/auth/logout", token, null, 204);
        call("GET", "/api/me", token, null, 401);
        call("GET", "/api/me", null, null, 401);
        call(
                "POST",
                "/api/auth/login",
                null,
                Map.of("email", advisor.email(), "password", "wrong"),
                401
        );
    }

    @Test
    void rejectsRoleAndDealershipEscalation() throws Exception {
        String jane = login("jane.doe@championsclub.example");
        String manager = login("alex.smith@championsclub.example");
        long otherDealershipAdvisor = userId("morgan.lee@championsclub.example");
        long northManager = userId("alex.smith@championsclub.example");

        call("GET", "/api/dashboard/advisor/" + otherDealershipAdvisor, jane, null, 403);
        call("GET", "/api/dashboard/advisor/" + otherDealershipAdvisor, manager, null, 403);
        call("GET", "/api/advisors", jane, null, 403);
        call("GET", "/api/dashboard/manager/" + northManager + "/dealership/" + south(), manager, null, 403);

        var advisors = call("GET", "/api/advisors?search=Morgan", manager, null, 200);
        assertThat(advisors.path("totalElements").asLong()).isZero();
    }

    @Test
    void disablingAccountInvalidatesExistingTokens() throws Exception {
        var advisor = newAdvisor();
        String token = login(advisor.email());

        database.update("update users set status = 'INACTIVE' where id = ?", advisor.id());

        call("GET", "/api/me", token, null, 401);
    }

    @Test
    void validatesLoginInput() throws Exception {
        var invalid = call(
                "POST",
                "/api/auth/login",
                null,
                Map.of("email", "", "password", "integration-password-123"),
                400
        );

        assertThat(invalid.path("code").asText()).isEqualTo("VALIDATION_FAILED");
        assertThat(invalid.path("fieldErrors").size()).isGreaterThan(0);
    }
}
