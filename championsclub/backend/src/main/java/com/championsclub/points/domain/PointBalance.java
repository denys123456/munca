package com.championsclub.points.domain;

public record PointBalance(int available) {
    public PointBalance {
        if (available < 0) {
            throw new IllegalArgumentException("Point balance cannot be negative.");
        }
    }

    public boolean canSpend(int amount) {
        return amount > 0 && available >= amount;
    }
}
