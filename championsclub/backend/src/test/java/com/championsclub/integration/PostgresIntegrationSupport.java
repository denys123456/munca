package com.championsclub.integration;
import com.fasterxml.jackson.databind.*;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.testcontainers.containers.PostgreSQLContainer;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(properties={
        "championsclub.demo.enabled=true","championsclub.demo.password=integration-password-123",
        "championsclub.security.jwt-secret=integration-signing-key-with-at-least-32-bytes",
        "championsclub.scheduling.enabled=false","championsclub.ml.base-url=http://127.0.0.1:9",
        "championsclub.ai.provider=DISABLED"})
@AutoConfigureMockMvc
abstract class PostgresIntegrationSupport {
    static final PostgreSQLContainer<?> postgres=new PostgreSQLContainer<>("postgres:16-alpine");
    static { postgres.start(); }
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",postgres::getJdbcUrl);
        registry.add("spring.datasource.username",postgres::getUsername);
        registry.add("spring.datasource.password",postgres::getPassword);
    }
    @Autowired MockMvc http;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate database;
    String admin;
    @BeforeEach void authenticateAdmin() throws Exception { admin=login("john.doe@championsclub.example"); }
    String login(String email) throws Exception {
        return call("POST","/api/auth/login",null,Map.of("email",email,"password","integration-password-123"),200).path("accessToken").asText();
    }
    JsonNode call(String method,String path,String token,Object body,int status) throws Exception {
        var request=MockMvcRequestBuilders.request(org.springframework.http.HttpMethod.valueOf(method),path).contentType(MediaType.APPLICATION_JSON);
        if (token != null) request.header("Authorization","Bearer "+token);
        if (body != null) request.content(json.writeValueAsBytes(body));
        var result=http.perform(request).andReturn();
        assertThat(result.getResponse().getStatus()).withFailMessage(result.getResponse().getContentAsString()).isEqualTo(status);
        String content=result.getResponse().getContentAsString();
        return content.isBlank() ? json.nullNode() : json.readTree(content);
    }
    long userId(String email) { return database.queryForObject("select id from users where email=?",Long.class,email); }
    long north() { return database.queryForObject("select id from dealerships where code='NORTH'",Long.class); }
    long product() { return database.queryForObject("select id from financial_products where code='FINANCE'",Long.class); }
    JsonNode newAdvisor() throws Exception {
        return call("POST","/api/admin/users",admin,Map.of("firstName","Test","lastName","Advisor",
                "email","advisor-"+UUID.randomUUID()+"@example.test","role","SALES_ADVISOR","dealershipId",north(),
                "active",true,"password","integration-password-123"),201);
    }
    JsonNode newReward(int cost,int stock) throws Exception {
        return call("POST","/api/admin/rewards",admin,Map.of("name","Test Voucher","category","Travel",
                "description","Test issuance","requiredPoints",cost,"stock",stock,"active",true),201);
    }
}
