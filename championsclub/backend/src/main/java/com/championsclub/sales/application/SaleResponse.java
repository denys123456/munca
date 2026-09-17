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
        int awardedPoints,
        String externalReference,
        String currency,
        com.championsclub.sales.domain.SaleStatus status
) {
    public static SaleResponse from(com.championsclub.sales.domain.Sale sale) {
        return new SaleResponse(sale.id(), sale.advisorId(), sale.dealershipId(), sale.productId(), sale.financedAmount(),
                sale.saleDate(), sale.awardedPoints(), sale.externalReference(), sale.currency(), sale.status());
    }
}
