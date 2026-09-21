package com.championsclub.gamification.infrastructure;

import com.championsclub.gamification.application.GamificationConfigurationRepository;
import com.championsclub.gamification.domain.GamificationThresholds;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class JdbcGamificationConfigurationRepository implements GamificationConfigurationRepository {
    private final JdbcTemplate database;

    JdbcGamificationConfigurationRepository(JdbcTemplate database) {
        this.database = database;
    }

    public GamificationThresholds thresholds() {
        return database.queryForObject(
                "select bronze, silver, gold from gamification_configuration where id=1",
                (result, row) -> new GamificationThresholds(
                        result.getInt("bronze"),
                        result.getInt("silver"),
                        result.getInt("gold")
                )
        );
    }
}
