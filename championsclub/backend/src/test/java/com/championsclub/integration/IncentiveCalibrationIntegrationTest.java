package com.championsclub.integration;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IncentiveCalibrationIntegrationTest extends PostgresIntegrationSupport {
    @Test
    void usesCalibratedGamificationThresholds() {
        assertThat(threshold("bronze")).isZero();
        assertThat(threshold("silver")).isEqualTo(60000);
        assertThat(threshold("gold")).isEqualTo(120000);
    }

    private int threshold(String column) {
        return database.queryForObject(
                "select " + column + " from gamification_configuration where id=1",
                Integer.class
        );
    }
}
