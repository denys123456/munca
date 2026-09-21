package com.championsclub.sales.application;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateSaleCommand(
        Long advisorId,
        Long dealershipId,
        Long productId,
        BigDecimal contractAmount,
        LocalDate saleDate,
        String externalReference,
        String currency
) {
}
