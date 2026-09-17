package com.championsclub.rewards.application;

public interface PointsLedger {

    int calculateAvailablePoints(Long advisorId);

    void append(Long advisorId, com.championsclub.points.domain.PointTransactionType type, int amount, long sourceId, String description);
}
