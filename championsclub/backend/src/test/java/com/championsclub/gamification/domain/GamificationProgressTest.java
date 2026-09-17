package com.championsclub.gamification.domain;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class GamificationProgressTest {
    @Test void usesConfiguredThresholds() {
        var bronze=GamificationProgress.calculate(500,0,1000,3000);
        assertThat(bronze.currentLevel()).isEqualTo(GamificationLevel.BRONZE);
        assertThat(bronze.nextLevel()).isEqualTo(GamificationLevel.SILVER);
        assertThat(bronze.remainingPoints()).isEqualTo(500);
        assertThat(bronze.progressPercentage()).isEqualTo(50);
        var silver=GamificationProgress.calculate(2000,0,1000,3000);
        assertThat(silver.currentLevel()).isEqualTo(GamificationLevel.SILVER);
        assertThat(silver.remainingPoints()).isEqualTo(1000);
        assertThat(silver.progressPercentage()).isEqualTo(50);
    }
    @Test void capsGoldProgress() {
        var gold=GamificationProgress.calculate(3500,0,1000,3000);
        assertThat(gold.currentLevel()).isEqualTo(GamificationLevel.GOLD);
        assertThat(gold.nextLevel()).isNull();
        assertThat(gold.remainingPoints()).isZero();
        assertThat(gold.progressPercentage()).isEqualTo(100);
    }
    @Test void rejectsInvalidConfiguration() {
        assertThatThrownBy(() -> GamificationProgress.calculate(500,0,2000,1000)).isInstanceOf(IllegalArgumentException.class);
    }
}
