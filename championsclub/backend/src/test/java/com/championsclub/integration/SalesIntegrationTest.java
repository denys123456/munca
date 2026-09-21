package com.championsclub.integration;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SalesIntegrationTest extends PostgresIntegrationSupport {
    @Test
    void saleAwardsPointsAndCancellationPreservesLedger() throws Exception {
        var advisor = newAdvisor();
        String token = login(advisor.email());
        var request = saleRequest(advisor.id(), product("FINANCE"), 10000);

        var sale = call("POST", "/api/sales", token, request, 201);
        int awardedPoints = sale.path("awardedPoints").asInt();

        assertThat(awardedPoints).isPositive();
        var pointsAfterSale = call("GET", "/api/points/" + advisor.id(), token, null, 200);
        assertThat(pointsAfterSale.path("availablePoints").asInt()).isEqualTo(awardedPoints);
        assertThat(pointsAfterSale.path("lifetimeEarnedPoints").asInt()).isEqualTo(awardedPoints);
        assertThat(call(
                "GET",
                "/api/targets/progress?ownerType=ADVISOR&ownerId=" + advisor.id(),
                token,
                null,
                200
        ).path("progress").path("achievedAmount").decimalValue()).isEqualByComparingTo("10000");

        call("POST", "/api/sales", token, request, 409);
        call("POST", "/api/sales/" + sale.path("id").asLong() + "/cancel", token, null, 200);

        var pointsAfterCancellation = call("GET", "/api/points/" + advisor.id(), token, null, 200);
        assertThat(pointsAfterCancellation.path("availablePoints").asInt()).isZero();
        assertThat(pointsAfterCancellation.path("lifetimeEarnedPoints").asInt()).isZero();

        var ledger = call("GET", "/api/points/" + advisor.id() + "/transactions", token, null, 200);
        assertThat(ledger.path("totalElements").asInt()).isEqualTo(2);
        assertThat(ledger.path("content").get(0).path("type").asText()).isEqualTo("SALE_REVERSAL");

        call("POST", "/api/sales/" + sale.path("id").asLong() + "/cancel", token, null, 409);
    }

    @Test
    void saleWithoutPointRuleCreatesNoZeroValueLedgerEntry() throws Exception {
        var advisor = newAdvisor();
        String token = login(advisor.email());
        long productId = newProduct(true, "SALES");

        var sale = call(
                "POST",
                "/api/sales",
                token,
                saleRequest(advisor.id(), productId, 10000),
                201
        );

        assertThat(sale.path("awardedPoints").asInt()).isZero();
        var ledger = call("GET", "/api/points/" + advisor.id() + "/transactions", token, null, 200);
        assertThat(ledger.path("totalElements").asInt()).isZero();

        call("POST", "/api/sales/" + sale.path("id").asLong() + "/cancel", token, null, 200);
        var ledgerAfterCancellation = call(
                "GET",
                "/api/points/" + advisor.id() + "/transactions",
                token,
                null,
                200
        );
        assertThat(ledgerAfterCancellation.path("totalElements").asInt()).isZero();
    }

    @Test
    void rejectsIneligibleProductAndOtherAdvisorSale() throws Exception {
        String jane = login("jane.doe@championsclub.example");
        long otherAdvisor = userId("emma.taylor@championsclub.example");

        call(
                "POST",
                "/api/sales",
                jane,
                saleRequest(otherAdvisor, product("FINANCE"), 10000),
                403
        );

        long ineligibleProduct = newProduct(false, "SALES");
        call(
                "POST",
                "/api/sales",
                jane,
                saleRequest(userId("jane.doe@championsclub.example"), ineligibleProduct, 10000),
                409
        );
    }

    @Test
    void rejectsProductOutsideAdvisorScope() throws Exception {
        String jane = login("jane.doe@championsclub.example");
        String john = login("john.doe@championsclub.example");

        call(
                "POST",
                "/api/sales",
                jane,
                saleRequest(userId("jane.doe@championsclub.example"), product("PROTECT"), 3000),
                409
        );
        call(
                "POST",
                "/api/sales",
                john,
                saleRequest(userId("john.doe@championsclub.example"), product("FINANCE"), 10000),
                409
        );
    }

    @Test
    void cancellationAfterRedemptionCanMakeAvailablePointsNegativeWithoutCorruptingLifetimeProgress() throws Exception {
        var advisor = newAdvisor();
        String token = login(advisor.email());
        long rewardId = newReward(200, 1);

        var sale = call(
                "POST",
                "/api/sales",
                token,
                saleRequest(advisor.id(), product("FINANCE"), 10000),
                201
        );
        call("POST", "/api/rewards/redemptions", token, Map.of("rewardId", rewardId), 201);

        var afterRedemption = call("GET", "/api/points/" + advisor.id(), token, null, 200);
        assertThat(afterRedemption.path("availablePoints").asInt()).isZero();
        assertThat(afterRedemption.path("lifetimeEarnedPoints").asInt()).isEqualTo(200);

        call("POST", "/api/sales/" + sale.path("id").asLong() + "/cancel", token, null, 200);

        var afterCancellation = call("GET", "/api/points/" + advisor.id(), token, null, 200);
        assertThat(afterCancellation.path("availablePoints").asInt()).isEqualTo(-200);
        assertThat(afterCancellation.path("lifetimeEarnedPoints").asInt()).isZero();
    }

    @Test
    void databaseEnforcesUniqueSaleReference() {
        String reference = database.queryForObject(
                "select external_reference from sales order by id limit 1",
                String.class
        );

        assertThatThrownBy(() -> database.update(
                """
                insert into sales(advisor_id, dealership_id, product_id, contract_amount, sale_date, awarded_points, status, external_reference)
                select advisor_id, dealership_id, product_id, contract_amount, sale_date, awarded_points, status, ?
                from sales
                order by id
                limit 1
                """,
                reference
        )).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    private Map<String, Object> saleRequest(long advisorId, long productId, int contractAmount) {
        return Map.of(
                "advisorId", advisorId,
                "dealershipId", north(),
                "productId", productId,
                "contractAmount", contractAmount,
                "saleDate", LocalDate.now().toString(),
                "externalReference", UUID.randomUUID().toString(),
                "currency", "EUR"
        );
    }
}
