package com.championsclub.sales.application;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SaleResponse(
        Long id,
        Long advisorId,
        Long dealershipId,
        Long productId,
        BigDecimal financedAmount,
        LocalDate saleDate,
        int awardedPoints
) {
}

