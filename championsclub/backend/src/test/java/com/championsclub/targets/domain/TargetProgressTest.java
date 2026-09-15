package com.championsclub.targets.domain;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class TargetProgressTest {
    private final LocalDate start=LocalDate.of(2026,9,1);
    private TargetProgress progress(long sales,int day) {
        return TargetProgress.calculate(BigDecimal.valueOf(3000),BigDecimal.valueOf(sales),start,start.plusDays(29),start.plusDays(day-1));
    }
    @Test void calculatesPaceAndRemaining() {
        var result=progress(1500,15);
        assertThat(result.remainingAmount()).isEqualByComparingTo("1500");
        assertThat(result.achievementPercentage()).isEqualByComparingTo("50");
        assertThat(result.daysRemaining()).isEqualTo(15);
        assertThat(result.currentAveragePace()).isEqualByComparingTo("100");
        assertThat(result.requiredAveragePace()).isEqualByComparingTo("100");
        assertThat(result.status()).isEqualTo(TargetProgress.Status.ON_TRACK);
    }
    @Test void definesRiskAheadAndAchieved() {
        assertThat(progress(1000,15).status()).isEqualTo(TargetProgress.Status.AT_RISK);
        assertThat(progress(1900,15).status()).isEqualTo(TargetProgress.Status.AHEAD);
        assertThat(progress(3000,15).status()).isEqualTo(TargetProgress.Status.ACHIEVED);
        assertThat(progress(2999,30).status()).isEqualTo(TargetProgress.Status.AT_RISK);
        assertThat(progress(4000,30).remainingAmount()).isZero();
    }
    @Test void handlesMissingTarget() {
        assertThat(TargetProgress.calculate(BigDecimal.ZERO,BigDecimal.ZERO,start,start.plusDays(29),start).status())
                .isEqualTo(TargetProgress.Status.NOT_CONFIGURED);
    }
}
