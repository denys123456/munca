package com.championsclub.rewards.application;

public record CreateRewardCommand(
        String name,
        String category,
        int requiredPoints
) {
}

