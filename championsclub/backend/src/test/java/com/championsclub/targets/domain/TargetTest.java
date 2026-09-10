package com.championsclub.targets.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class TargetTest {

    @Test
    void shouldCalculateTargetAchievementPercentage() {
        Target target = Target.builder()
                .ownerId(1L)
                .targetAmount(new BigDecimal("90000"))
                .startDate(LocalDate.now().withDayOfMonth(1))
                .endDate(LocalDate.now().withDayOfMonth(28))
                .build();

        int progress = target.calculateAchievementPercentage(new BigDecimal("45000"));

        assertThat(progress).isEqualTo(50);
    }
}

