package com.championsclub.sales.domain;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class FinancialProductTest {
    @Test void onlyActiveEligibleProductsAcceptSales() {
        assertThat(FinancialProduct.builder().name("Finance").code("FINANCE").eligible(true).active(true).build().acceptsSale()).isTrue();
        assertThat(FinancialProduct.builder().name("Finance").code("FINANCE").eligible(false).active(true).build().acceptsSale()).isFalse();
        assertThat(FinancialProduct.builder().name("Finance").code("FINANCE").eligible(true).active(false).build().acceptsSale()).isFalse();
    }
}
