package com.championsclub.sales.domain;

import com.championsclub.users.domain.AdvisorType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FinancialProductTest {
    @Test
    void onlyActiveEligibleProductsWithMatchingAdvisorScopeAcceptSales() {
        var salesProduct = FinancialProduct.builder()
                .name("Finance")
                .code("FINANCE")
                .eligible(true)
                .active(true)
                .advisorScope(ProductAdvisorScope.SALES)
                .build();
        var serviceProduct = FinancialProduct.builder()
                .name("Protection")
                .code("PROTECT")
                .eligible(true)
                .active(true)
                .advisorScope(ProductAdvisorScope.SERVICE)
                .build();
        var inactiveProduct = FinancialProduct.builder()
                .name("Finance")
                .code("INACTIVE")
                .eligible(true)
                .active(false)
                .advisorScope(ProductAdvisorScope.BOTH)
                .build();
        var ineligibleProduct = FinancialProduct.builder()
                .name("Finance")
                .code("INELIGIBLE")
                .eligible(false)
                .active(true)
                .advisorScope(ProductAdvisorScope.BOTH)
                .build();

        assertThat(salesProduct.acceptsSale(AdvisorType.SALES)).isTrue();
        assertThat(salesProduct.acceptsSale(AdvisorType.SERVICE)).isFalse();
        assertThat(serviceProduct.acceptsSale(AdvisorType.SERVICE)).isTrue();
        assertThat(serviceProduct.acceptsSale(AdvisorType.SALES)).isFalse();
        assertThat(inactiveProduct.acceptsSale(AdvisorType.SALES)).isFalse();
        assertThat(ineligibleProduct.acceptsSale(AdvisorType.SALES)).isFalse();
    }
}
