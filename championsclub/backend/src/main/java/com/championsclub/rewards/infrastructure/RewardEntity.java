package com.championsclub.rewards.infrastructure;

import com.championsclub.rewards.domain.Reward;
import com.championsclub.rewards.domain.RewardStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rewards")
class RewardEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private int requiredPoints;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardStatus status;

    protected RewardEntity() {
    }

    private RewardEntity(Reward reward) {
        this.id = reward.id();
        this.name = reward.name();
        this.category = reward.category();
        this.requiredPoints = reward.requiredPoints();
        this.status = reward.status();
    }

    static RewardEntity fromDomain(Reward reward) {
        return new RewardEntity(reward);
    }

    Reward toDomain() {
        return Reward.builder()
                .id(id)
                .name(name)
                .category(category)
                .requiredPoints(requiredPoints)
                .status(status)
                .build();
    }
}
