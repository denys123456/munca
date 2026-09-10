package com.championsclub.rewards.application;

public record RewardCatalogItem(
        Long id,
        String name,
        String category,
        int requiredPoints,
        boolean canRedeem
) {
}

