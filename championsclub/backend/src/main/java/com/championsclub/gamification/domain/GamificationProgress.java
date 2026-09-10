package com.championsclub.gamification.domain;

public record GamificationProgress(
        GamificationLevel currentLevel,
        GamificationLevel nextLevel,
        int currentPoints,
        int remainingPoints,
        int progressPercentage
) {

    public static GamificationProgress calculate(int points) {
        GamificationLevel currentLevel = GamificationLevel.fromPoints(points);
        GamificationLevel nextLevel = nextLevelAfter(currentLevel);
        int remainingPoints = nextLevel == null ? 0 : nextLevel.minimumPoints() - points;
        int progressPercentage = calculateProgressPercentage(currentLevel, nextLevel, points);
        return new GamificationProgress(currentLevel, nextLevel, points, remainingPoints, progressPercentage);
    }

    private static GamificationLevel nextLevelAfter(GamificationLevel currentLevel) {
        return switch (currentLevel) {
            case BRONZE -> GamificationLevel.SILVER;
            case SILVER -> GamificationLevel.GOLD;
            case GOLD -> null;
        };
    }

    private static int calculateProgressPercentage(GamificationLevel currentLevel, GamificationLevel nextLevel, int points) {
        if (nextLevel == null) {
            return 100;
        }
        int levelPoints = points - currentLevel.minimumPoints();
        int levelRange = nextLevel.minimumPoints() - currentLevel.minimumPoints();
        return Math.min(100, Math.max(0, levelPoints * 100 / levelRange));
    }
}

