package com.championsclub.integration;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class SalesIntegrationTest extends PostgresIntegrationSupport {
    @Test void saleAwardsPointsAndCancellationPreservesLedger() throws Exception {
        var advisor=newAdvisor();
        long id=advisor.path("id").asLong();
        String token=login(advisor.path("email").asText());
        var request=Map.of("advisorId",id,"dealershipId",north(),"productId",product(),"financedAmount",10000,
                "saleDate",LocalDate.now().toString(),"externalReference",UUID.randomUUID().toString(),"currency","EUR");
        var sale=call("POST","/api/sales",token,request,201);
        int awarded=sale.path("awardedPoints").asInt();
        assertThat(awarded).isPositive();
        assertThat(call("GET","/api/points/"+id,token,null,200).path("availablePoints").asInt()).isEqualTo(awarded);
        assertThat(call("GET","/api/targets/progress?ownerType=ADVISOR&ownerId="+id,token,null,200)
                .path("progress").path("achievedAmount").decimalValue()).isEqualByComparingTo("10000");
        call("POST","/api/sales",token,request,409);
        call("POST","/api/sales/"+sale.path("id").asLong()+"/cancel",token,null,200);
        assertThat(call("GET","/api/points/"+id,token,null,200).path("availablePoints").asInt()).isZero();
        var ledger=call("GET","/api/points/"+id+"/transactions",token,null,200);
        assertThat(ledger.path("totalElements").asInt()).isEqualTo(2);
        assertThat(ledger.path("content").get(0).path("type").asText()).isEqualTo("SALE_REVERSAL");
        call("POST","/api/sales/"+sale.path("id").asLong()+"/cancel",token,null,409);
        var history=call("GET","/api/sales?advisorId="+id+"&status=CANCELLED&size=1",token,null,200);
        assertThat(history.path("totalElements").asInt()).isEqualTo(1);
    }
    @Test void rejectsIneligibleProductAndOtherAdvisorSale() throws Exception {
        String jane=login("jane.doe@championsclub.example");
        long other=userId("emma.taylor@championsclub.example");
        call("POST","/api/sales",jane,Map.of("advisorId",other,"dealershipId",north(),"productId",product(),
                "financedAmount",10000,"saleDate",LocalDate.now().toString(),"externalReference",UUID.randomUUID().toString(),"currency","EUR"),403);
        var product=call("POST","/api/admin/products",admin,Map.of("name","Ineligible","code","P-"+UUID.randomUUID(),
                "description","Not eligible","eligible",false,"active",true),201);
        call("POST","/api/sales",jane,Map.of("advisorId",userId("jane.doe@championsclub.example"),"dealershipId",north(),
                "productId",product.path("id").asLong(),"financedAmount",10000,"saleDate",LocalDate.now().toString(),
                "externalReference",UUID.randomUUID().toString(),"currency","EUR"),409);
    }
    @Test void databaseEnforcesUniqueSaleReference() {
        String reference=database.queryForObject("select external_reference from sales order by id limit 1",String.class);
        assertThatThrownBy(() -> database.update("""
                insert into sales(advisor_id,dealership_id,product_id,financed_amount,sale_date,awarded_points,status,external_reference)
                select advisor_id,dealership_id,product_id,financed_amount,sale_date,awarded_points,status,? from sales order by id limit 1
                """,reference)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }
}
