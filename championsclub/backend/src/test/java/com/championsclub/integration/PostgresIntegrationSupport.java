package com.championsclub.integration;

import com.championsclub.users.domain.AdvisorType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "championsclub.demo.enabled=true",
        "championsclub.demo.password=integration-password-123",
        "championsclub.security.jwt-secret=integration-signing-key-with-at-least-32-bytes",
        "championsclub.scheduling.enabled=false",
        "championsclub.ml.base-url=http://127.0.0.1:9",
        "championsclub.ai.provider=DISABLED"
})
@AutoConfigureMockMvc
abstract class PostgresIntegrationSupport {
    static final String externalDatabase = System.getenv("CHAMPIONSCLUB_TEST_DATABASE_URL");
    static final PostgreSQLContainer<?> postgres = externalDatabase == null
            ? new PostgreSQLContainer<>("postgres:16-alpine") : null;
    static final String testSchema = "test_" + UUID.randomUUID().toString().replace("-", "");

    static {
        if (postgres != null) postgres.start();
        else {
            try (var connection = java.sql.DriverManager.getConnection(externalDatabase,
                    System.getenv("CHAMPIONSCLUB_TEST_DATABASE_USER"),
                    System.getenv("CHAMPIONSCLUB_TEST_DATABASE_PASSWORD"));
                 var statement = connection.createStatement()) {
                statement.executeUpdate("create schema " + testSchema);
            } catch (java.sql.SQLException exception) {
                throw new ExceptionInInitializerError(exception);
            }
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> postgres == null
                ? externalDatabase + (externalDatabase.contains("?") ? "&" : "?") + "currentSchema=" + testSchema + ",public"
                : postgres.getJdbcUrl());
        if (postgres == null) registry.add("spring.flyway.default-schema", () -> testSchema);
        registry.add("spring.datasource.username", () -> postgres == null
                ? System.getenv("CHAMPIONSCLUB_TEST_DATABASE_USER") : postgres.getUsername());
        registry.add("spring.datasource.password", () -> postgres == null
                ? System.getenv("CHAMPIONSCLUB_TEST_DATABASE_PASSWORD") : postgres.getPassword());
    }

    @Autowired
    MockMvc http;

    @Autowired
    ObjectMapper json;

    @Autowired
    JdbcTemplate database;

    String managerToken;

    @BeforeEach
    void authenticateManager() throws Exception {
        managerToken = login("alex.smith@championsclub.example");
    }

    String login(String email) throws Exception {
        return call(
                "POST",
                "/api/auth/login",
                null,
                Map.of("email", email, "password", "integration-password-123"),
                200
        ).path("accessToken").asText();
    }

    JsonNode call(String method, String path, String token, Object body, int status) throws Exception {
        var request = MockMvcRequestBuilders.request(org.springframework.http.HttpMethod.valueOf(method), path)
                .contentType(MediaType.APPLICATION_JSON);
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        if (body != null) {
            request.content(json.writeValueAsBytes(body));
        }
        var result = http.perform(request).andReturn();
        assertThat(result.getResponse().getStatus())
                .withFailMessage(result.getResponse().getContentAsString())
                .isEqualTo(status);
        String content = result.getResponse().getContentAsString();
        return content.isBlank() ? json.nullNode() : json.readTree(content);
    }

    long userId(String email) {
        return database.queryForObject("select id from users where email = ?", Long.class, email);
    }

    long north() {
        return database.queryForObject("select id from dealerships where code = 'NORTH'", Long.class);
    }

    long south() {
        return database.queryForObject("select id from dealerships where code = 'SOUTH'", Long.class);
    }

    long product(String code) {
        return database.queryForObject("select id from financial_products where code = ?", Long.class, code);
    }

    TestUser newAdvisor() {
        return newAdvisor(AdvisorType.SALES);
    }

    TestUser newAdvisor(AdvisorType advisorType) {
        String email = "advisor-" + UUID.randomUUID() + "@example.test";
        String passwordHash = database.queryForObject(
                "select password_hash from users where email = 'jane.doe@championsclub.example'",
                String.class
        );
        Long id = database.queryForObject(
                """
                insert into users(first_name, last_name, email, dealership_id, role, status, password_hash, advisor_type)
                values ('Test', 'Advisor', ?, ?, 'ADVISOR', 'ACTIVE', ?, ?)
                returning id
                """,
                Long.class,
                email,
                north(),
                passwordHash,
                advisorType.name()
        );
        createMonthlyTarget(id, BigDecimal.valueOf(advisorType == AdvisorType.SALES ? 10000 : 5000));
        return new TestUser(id, email, advisorType);
    }

    long newReward(int requiredPoints, int stock) {
        return database.queryForObject(
                """
                insert into rewards(name, category, required_points, status, description, stock)
                values (?, 'Travel', ?, 'ACTIVE', 'Integration test reward', ?)
                returning id
                """,
                Long.class,
                "Test Voucher " + UUID.randomUUID(),
                requiredPoints,
                stock
        );
    }

    long newProduct(boolean eligible, String advisorScope) {
        String code = "TEST-" + UUID.randomUUID().toString().substring(0, 32);
        return database.queryForObject(
                """
                insert into financial_products(name, eligible, code, description, active, advisor_scope)
                values ('Integration Product', ?, ?, 'Integration test product', true, ?)
                returning id
                """,
                Long.class,
                eligible,
                code,
                advisorScope
        );
    }

    private void createMonthlyTarget(long advisorId, BigDecimal amount) {
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        database.update(
                """
                insert into targets(owner_id, owner_type, target_amount, start_date, end_date, status, currency, created_by)
                values (?, 'ADVISOR', ?, ?, ?, 'ACTIVE', 'EUR', ?)
                """,
                advisorId,
                amount,
                start,
                start.plusMonths(1).minusDays(1),
                userId("alex.smith@championsclub.example")
        );
    }

    record TestUser(long id, String email, AdvisorType advisorType) {
    }
}
