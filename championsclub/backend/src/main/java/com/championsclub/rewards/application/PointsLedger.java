package com.championsclub.rewards.application;

import com.championsclub.points.domain.PointTransactionType;

public interface PointsLedger {
    int calculateAvailablePoints(Long advisorId);
    int calculateLifetimeEarnedPoints(Long advisorId);
    void append(Long advisorId, PointTransactionType type, int amount, long sourceId, String description);
}
