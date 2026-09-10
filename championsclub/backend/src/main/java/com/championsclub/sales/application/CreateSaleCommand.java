package com.championsclub.sales.application;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateSaleCommand(
        Long advisorId,
        Long dealershipId,
        Long productId,
        BigDecimal financedAmount,
        LocalDate saleDate
) {
}

