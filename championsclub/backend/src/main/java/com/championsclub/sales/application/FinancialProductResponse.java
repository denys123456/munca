package com.championsclub.sales.application;

public record FinancialProductResponse(
        Long id,
        String name,
        int pointsPerThousandEuro,
        boolean isEligible
) {
}

