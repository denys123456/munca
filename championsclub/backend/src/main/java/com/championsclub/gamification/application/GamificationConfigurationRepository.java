package com.championsclub.gamification.application;

import com.championsclub.gamification.domain.GamificationThresholds;

public interface GamificationConfigurationRepository {
    GamificationThresholds thresholds();
}
