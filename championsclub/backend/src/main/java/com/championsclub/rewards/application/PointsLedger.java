package com.championsclub.rewards.application;

public interface PointsLedger {

    int calculateAvailablePoints(Long advisorId);

    void recordRewardRedemption(Long advisorId, Long rewardId, int redeemedPoints);
}

