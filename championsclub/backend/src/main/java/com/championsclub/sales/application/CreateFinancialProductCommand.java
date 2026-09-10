package com.championsclub.sales.application;

public record CreateFinancialProductCommand(
        String name,
        int pointsPerThousandEuro,
        boolean isEligible
) {
}

