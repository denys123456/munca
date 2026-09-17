package com.championsclub.points.domain;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class PointRuleTest {
    private final LocalDate start=LocalDate.of(2026,9,1);
    private final PointRule rule=new PointRule(150,BigDecimal.valueOf(500),start,start.plusDays(29),true);
    @Test void awardsEligibleSale() { assertThat(rule.award(true,BigDecimal.valueOf(500),start)).isEqualTo(150); }
    @Test void rejectsIneligibleProduct() { assertThat(rule.award(false,BigDecimal.valueOf(500),start)).isZero(); }
    @Test void enforcesMinimumAmount() { assertThat(rule.award(true,BigDecimal.valueOf(499),start)).isZero(); }
    @Test void enforcesPeriod() { assertThat(rule.award(true,BigDecimal.valueOf(500),start.minusDays(1))).isZero(); }
    @Test void validatesBalance() {
        assertThat(new PointBalance(650).canSpend(650)).isTrue();
        assertThat(new PointBalance(649).canSpend(650)).isFalse();
        assertThatThrownBy(() -> new PointBalance(-1)).isInstanceOf(IllegalArgumentException.class);
    }
}
