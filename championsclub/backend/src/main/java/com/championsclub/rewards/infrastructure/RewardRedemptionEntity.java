package com.championsclub.rewards.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "reward_redemptions")
class RewardRedemptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long advisorId;

    @Column(nullable = false)
    private Long rewardId;

    @Column(nullable = false)
    private int redeemedPoints;

    @Column(nullable = false)
    private Instant redeemedAt;

    protected RewardRedemptionEntity() {
    }

    RewardRedemptionEntity(Long advisorId, Long rewardId, int redeemedPoints) {
        this.advisorId = advisorId;
        this.rewardId = rewardId;
        this.redeemedPoints = redeemedPoints;
        this.redeemedAt = Instant.now();
    }
}

