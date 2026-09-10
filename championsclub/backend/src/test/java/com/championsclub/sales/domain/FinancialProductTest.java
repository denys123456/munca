package com.championsclub.sales.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class FinancialProductTest {

    @Test
    void shouldAwardPointsForEligibleFinancialProduct() {
        FinancialProduct product = FinancialProduct.builder()
                .name("Leasing Plus")
                .pointsPerThousandEuro(16)
                .eligible(true)
                .build();

        int points = product.calculatePoints(new BigDecimal("38500"));

        assertThat(points).isEqualTo(608);
    }

    @Test
    void shouldNotAwardPointsForIneligibleFinancialProduct() {
        FinancialProduct product = FinancialProduct.builder()
                .name("Excluded Product")
                .pointsPerThousandEuro(16)
                .eligible(false)
                .build();

        int points = product.calculatePoints(new BigDecimal("38500"));

        assertThat(points).isZero();
    }
}

