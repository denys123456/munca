package com.championsclub.gamification.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GamificationProgressTest {

    @Test
    void shouldPromoteAdvisorToGoldWhenRequiredPointsAreReached() {
        GamificationProgress progress = GamificationProgress.calculate(2600);

        assertThat(progress.currentLevel()).isEqualTo(GamificationLevel.GOLD);
        assertThat(progress.progressPercentage()).isEqualTo(100);
        assertThat(progress.remainingPoints()).isZero();
    }

    @Test
    void shouldCalculateRemainingPointsToNextLevel() {
        GamificationProgress progress = GamificationProgress.calculate(1300);

        assertThat(progress.currentLevel()).isEqualTo(GamificationLevel.SILVER);
        assertThat(progress.nextLevel()).isEqualTo(GamificationLevel.GOLD);
        assertThat(progress.remainingPoints()).isEqualTo(1300);
    }
}

