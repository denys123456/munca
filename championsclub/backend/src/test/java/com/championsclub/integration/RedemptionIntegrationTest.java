package com.championsclub.integration;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class RedemptionIntegrationTest extends PostgresIntegrationSupport {

    @Test
    void rewardCatalogSerializesRewardData() throws Exception {
        var advisor = newAdvisor();
        String token = login(advisor.email());
        long rewardId = newReward(650, 2);

        var catalog = call(
                "GET",
                "/api/rewards/advisor/" + advisor.id() + "?size=10",
                token,
                null,
                200
        );

        var reward = catalog.path("content").get(0).path("reward");
        assertThat(reward.path("id").asLong()).isEqualTo(rewardId);
        assertThat(reward.path("requiredPoints").asInt()).isEqualTo(650);
        assertThat(reward.path("status").asText()).isEqualTo("ACTIVE");
        assertThat(reward.path("available").asBoolean()).isTrue();
        assertThat(catalog.path("content").get(0).has("canRedeem")).isTrue();
        assertThat(catalog.path("content").get(0).has("missingPoints")).isTrue();
    }
    @Test
    void redemptionIsAtomicAndIssuesVoucherWithoutReducingLifetimeProgress() throws Exception {
        var advisor = newAdvisor();
        String token = login(advisor.email());
        long rewardId = newReward(650, 1);

        call(
                "POST",
                "/api/points/" + advisor.id() + "/adjustments",
                managerToken,
                Map.of("amount", 650, "reason", "Test award"),
                200
        );
        var redemption = call("POST", "/api/rewards/redemptions", token, Map.of("rewardId", rewardId), 201);

        assertThat(UUID.fromString(redemption.path("voucherCode").asText())).isNotNull();
        assertThat(redemption.path("status").asText()).isEqualTo("ISSUED");

        var points = call("GET", "/api/points/" + advisor.id(), token, null, 200);
        assertThat(points.path("availablePoints").asInt()).isZero();
        assertThat(points.path("lifetimeEarnedPoints").asInt()).isZero();
        assertThat(database.queryForObject("select stock from rewards where id = ?", Integer.class, rewardId)).isZero();

        call("POST", "/api/rewards/redemptions", token, Map.of("rewardId", rewardId), 409);
        assertThat(call("GET", "/api/redemptions", token, null, 200).path("totalElements").asInt()).isEqualTo(1);
    }

    @Test
    void simultaneousRequestsCannotSpendSameBalanceTwice() throws Exception {
        var advisor = newAdvisor();
        String token = login(advisor.email());
        long rewardId = newReward(650, 2);

        call(
                "POST",
                "/api/points/" + advisor.id() + "/adjustments",
                managerToken,
                Map.of("amount", 650, "reason", "Concurrency award"),
                200
        );

        assertThat(race(token, token, rewardId)).containsExactlyInAnyOrder(201, 409);
        assertThat(call("GET", "/api/points/" + advisor.id(), token, null, 200).path("availablePoints").asInt()).isZero();
        assertThat(database.queryForObject("select stock from rewards where id = ?", Integer.class, rewardId)).isEqualTo(1);
    }

    @Test
    void simultaneousAdvisorsCannotSpendLastStockTwice() throws Exception {
        var first = newAdvisor();
        var second = newAdvisor();
        for (var advisor : List.of(first, second)) {
            call(
                    "POST",
                    "/api/points/" + advisor.id() + "/adjustments",
                    managerToken,
                    Map.of("amount", 650, "reason", "Concurrency award"),
                    200
            );
        }
        long rewardId = newReward(650, 1);

        assertThat(race(login(first.email()), login(second.email()), rewardId)).containsExactlyInAnyOrder(201, 409);
        assertThat(database.queryForObject(
                "select count(*) from reward_redemptions where reward_id = ?",
                Long.class,
                rewardId
        )).isEqualTo(1L);
    }

    private List<Integer> race(String firstToken, String secondToken, long rewardId) throws Exception {
        var gate = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> redeemAfter(gate, firstToken, rewardId));
            var second = executor.submit(() -> redeemAfter(gate, secondToken, rewardId));
            gate.countDown();
            return List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS));
        }
    }

    private int redeemAfter(CountDownLatch gate, String token, long rewardId) throws Exception {
        gate.await();
        return http.perform(post("/api/rewards/redemptions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsBytes(Map.of("rewardId", rewardId))))
                .andReturn()
                .getResponse()
                .getStatus();
    }
}
