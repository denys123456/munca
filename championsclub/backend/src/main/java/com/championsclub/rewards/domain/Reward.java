package com.championsclub.rewards.domain;

public class Reward {

    private final Long id;
    private final String name;
    private final String category;
    private final int requiredPoints;
    private final RewardStatus status;

    private Reward(Builder builder) {
        this.id = builder.id;
        this.name = requireText(builder.name);
        this.category = requireText(builder.category);
        this.requiredPoints = requirePositive(builder.requiredPoints);
        this.status = builder.status == null ? RewardStatus.ACTIVE : builder.status;
    }

    public static Builder builder() {
        return new Builder();
    }

    public boolean canBeRedeemedWith(int availablePoints) {
        return status == RewardStatus.ACTIVE && availablePoints >= requiredPoints;
    }

    public Long id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String category() {
        return category;
    }

    public int requiredPoints() {
        return requiredPoints;
    }

    public RewardStatus status() {
        return status;
    }

    private static String requireText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Reward values must be provided.");
        }
        return value.trim();
    }

    private static int requirePositive(int value) {
        if (value <= 0) {
            throw new IllegalArgumentException("Reward points must be positive.");
        }
        return value;
    }

    public static final class Builder {
        private Long id;
        private String name;
        private String category;
        private int requiredPoints;
        private RewardStatus status;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder requiredPoints(int requiredPoints) {
            this.requiredPoints = requiredPoints;
            return this;
        }

        public Builder status(RewardStatus status) {
            this.status = status;
            return this;
        }

        public Reward build() {
            return new Reward(this);
        }
    }
}

