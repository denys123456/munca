package com.championsclub.gamification.domain;

public record GamificationThresholds(int bronze, int silver, int gold) {
    public GamificationThresholds {
        if (bronze != 0 || silver <= bronze || gold <= silver) {
            throw new IllegalArgumentException("Gamification thresholds must start at zero and increase strictly.");
        }
    }
}
