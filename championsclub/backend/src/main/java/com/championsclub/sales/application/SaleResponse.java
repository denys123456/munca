package com.championsclub.sales.application;

import com.championsclub.sales.domain.CustomerSegment;
import com.championsclub.sales.domain.SaleStatus;
import com.championsclub.sales.domain.VehicleCondition;
import com.championsclub.sales.domain.VehiclePowertrain;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SaleResponse(
        Long id,
        Long advisorId,
        Long dealershipId,
        Long productId,
        BigDecimal contractAmount,
        LocalDate saleDate,
        int awardedPoints,
        String externalReference,
        String currency,
        SaleStatus status,
        VehiclePowertrain vehiclePowertrain,
        VehicleCondition vehicleCondition,
        CustomerSegment customerSegment,
        Instant cancelledAt
) {
    public static SaleResponse from(com.championsclub.sales.domain.Sale sale) {
        return new SaleResponse(
                sale.id(),
                sale.advisorId(),
                sale.dealershipId(),
                sale.productId(),
                sale.contractAmount(),
                sale.saleDate(),
                sale.awardedPoints(),
                sale.externalReference(),
                sale.currency(),
                sale.status(),
                sale.vehiclePowertrain(),
                sale.vehicleCondition(),
                sale.customerSegment(),
                sale.cancelledAt()
        );
    }
}
