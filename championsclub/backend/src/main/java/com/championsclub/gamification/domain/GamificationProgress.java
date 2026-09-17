package com.championsclub.gamification.domain;
public record GamificationProgress(GamificationLevel currentLevel,GamificationLevel nextLevel,int currentPoints,
                                   int remainingPoints,int progressPercentage) {
    public static GamificationProgress calculate(int points,int bronze,int silver,int gold) {
        if (points < 0 || bronze != 0 || silver <= bronze || gold <= silver) throw new IllegalArgumentException("Invalid gamification inputs.");
        if (points >= gold) return new GamificationProgress(GamificationLevel.GOLD,null,points,0,100);
        boolean isSilver=points>=silver;
        int minimum=isSilver ? silver : bronze;
        int next=isSilver ? gold : silver;
        return new GamificationProgress(isSilver ? GamificationLevel.SILVER : GamificationLevel.BRONZE,
                isSilver ? GamificationLevel.GOLD : GamificationLevel.SILVER,points,next-points,
                (int)((long)(points-minimum)*100/(next-minimum)));
    }
}
