package com.championsclub.gamification.domain;

public enum GamificationLevel {
    BRONZE(0),
    SILVER(1200),
    GOLD(2600);

    private final int minimumPoints;

    GamificationLevel(int minimumPoints) {
        this.minimumPoints = minimumPoints;
    }

    public int minimumPoints() {
        return minimumPoints;
    }

    public static GamificationLevel fromPoints(int points) {
        if (points >= GOLD.minimumPoints) {
            return GOLD;
        }
        if (points >= SILVER.minimumPoints) {
            return SILVER;
        }
        return BRONZE;
    }
}

