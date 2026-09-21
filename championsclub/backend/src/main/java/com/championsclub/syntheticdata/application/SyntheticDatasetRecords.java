package com.championsclub.syntheticdata.application;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

record DatasetManifest(
        String runId,
        long seed,
        Instant generatedAt,
        LocalDate periodStart,
        LocalDate periodEnd,
        int dealershipCount,
        int managerCount,
        int advisorCount,
        int contractCount,
        String calibrationVersion,
        JsonNode sourceManifest
) {
}

record DealershipRow(long id, String name, String code, String city, String region, boolean active) {
}

record UserRow(
        long id,
        String firstName,
        String lastName,
        String email,
        String role,
        String advisorType,
        long dealershipId,
        boolean active
) {
}

record ProductRow(
        long id,
        String name,
        String code,
        String description,
        String category,
        String advisorScope,
        boolean eligible,
        boolean active
) {
}

record PointRuleRow(
        long id,
        long productId,
        int pointsPerSale,
        BigDecimal minimumEligibleAmount,
        LocalDate activeFrom,
        LocalDate activeUntil,
        boolean active
) {
}

record GamificationRow(int bronze, int silver, int gold) {
}

record RewardRow(
        long id,
        String name,
        String category,
        String description,
        int requiredPoints,
        int stock,
        String imageReference
) {
}

record SaleRow(
        long id,
        long advisorId,
        long dealershipId,
        long productId,
        BigDecimal contractAmount,
        LocalDate saleDate,
        Instant recordedAt,
        String externalReference,
        String currency,
        String status,
        String vehiclePowertrain,
        String vehicleCondition,
        String customerSegment,
        Instant cancelledAt
) {
}

record TargetRow(
        long id,
        String ownerType,
        long ownerId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal targetAmount,
        String currency,
        long createdBy,
        Instant createdAt,
        boolean active
) {
}

record RedemptionIntentRow(long id, long advisorId, long rewardId, Instant redeemedAt) {
}

record PointTransactionRow(
        long advisorId,
        String type,
        int amount,
        long sourceId,
        String description,
        Instant createdAt
) {
}
