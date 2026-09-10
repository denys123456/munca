package com.championsclub.dashboard.application;

import java.math.BigDecimal;

public record LeaderboardEntry(
        Long advisorId,
        String advisorName,
        BigDecimal monthSales,
        int points,
        int rank
) {
}

