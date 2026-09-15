package com.championsclub.integration;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.assertj.core.api.Assertions.*;
class RedemptionIntegrationTest extends PostgresIntegrationSupport {
    @Test void redemptionIsAtomicAndIssuesVoucher() throws Exception {
        var advisor=newAdvisor();
        long id=advisor.path("id").asLong();
        String token=login(advisor.path("email").asText());
        long reward=newReward(650,1).path("id").asLong();
        call("POST","/api/points/"+id+"/adjustments",admin,Map.of("amount",650,"reason","Test award"),200);
        var redemption=call("POST","/api/rewards/redemptions",token,Map.of("rewardId",reward),201);
        assertThat(UUID.fromString(redemption.path("voucherCode").asText())).isNotNull();
        assertThat(redemption.path("status").asText()).isEqualTo("ISSUED");
        assertThat(call("GET","/api/points/"+id,token,null,200).path("availablePoints").asInt()).isZero();
        assertThat(call("GET","/api/admin/rewards/"+reward,admin,null,200).path("stock").asInt()).isZero();
        call("POST","/api/rewards/redemptions",token,Map.of("rewardId",reward),409);
        assertThat(call("GET","/api/redemptions",token,null,200).path("totalElements").asInt()).isEqualTo(1);
    }
    @Test void simultaneousRequestsCannotSpendSameBalanceTwice() throws Exception {
        var advisor=newAdvisor();
        long id=advisor.path("id").asLong();
        String token=login(advisor.path("email").asText());
        long reward=newReward(650,2).path("id").asLong();
        call("POST","/api/points/"+id+"/adjustments",admin,Map.of("amount",650,"reason","Concurrency award"),200);
        assertThat(race(token,token,reward)).containsExactlyInAnyOrder(201,409);
        assertThat(call("GET","/api/points/"+id,token,null,200).path("availablePoints").asInt()).isZero();
        assertThat(call("GET","/api/admin/rewards/"+reward,admin,null,200).path("stock").asInt()).isEqualTo(1);
    }
    @Test void simultaneousAdvisorsCannotSpendLastStockTwice() throws Exception {
        var first=newAdvisor();
        var second=newAdvisor();
        for (var user : List.of(first,second)) call("POST","/api/points/"+user.path("id").asLong()+"/adjustments",admin,
                Map.of("amount",650,"reason","Concurrency award"),200);
        long reward=newReward(650,1).path("id").asLong();
        assertThat(race(login(first.path("email").asText()),login(second.path("email").asText()),reward)).containsExactlyInAnyOrder(201,409);
        assertThat(database.queryForObject("select count(*) from reward_redemptions where reward_id=?",Long.class,reward)).isEqualTo(1L);
    }
    private List<Integer> race(String first,String second,long reward) throws Exception {
        var gate=new CountDownLatch(1);
        try (var executor=Executors.newFixedThreadPool(2)) {
            var one=executor.submit(() -> redeemAfter(gate,first,reward));
            var two=executor.submit(() -> redeemAfter(gate,second,reward));
            gate.countDown();
            return List.of(one.get(20,TimeUnit.SECONDS),two.get(20,TimeUnit.SECONDS));
        }
    }
    private int redeemAfter(CountDownLatch gate,String token,long reward) throws Exception {
        gate.await();
        return http.perform(post("/api/rewards/redemptions").header("Authorization","Bearer "+token)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(Map.of("rewardId",reward))))
                .andReturn().getResponse().getStatus();
    }
}
