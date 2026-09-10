package com.championsclub.sales.infrastructure;

import com.championsclub.sales.application.CreateSaleCommand;
import com.championsclub.sales.application.CreateSaleCommandHandler;
import com.championsclub.sales.application.SaleResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/sales")
class SalesController {

    private final CreateSaleCommandHandler createSaleCommandHandler;

    SalesController(CreateSaleCommandHandler createSaleCommandHandler) {
        this.createSaleCommandHandler = createSaleCommandHandler;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SALES_ADVISOR','MANAGER','ADMIN')")
    SaleResponse createSale(@Valid @RequestBody CreateSaleRequest request) {
        return createSaleCommandHandler.createSale(new CreateSaleCommand(
                request.advisorId(),
                request.dealershipId(),
                request.productId(),
                request.financedAmount(),
                request.saleDate()
        ));
    }

    record CreateSaleRequest(
            @NotNull @Positive Long advisorId,
            @NotNull @Positive Long dealershipId,
            @NotNull @Positive Long productId,
            @NotNull @DecimalMin("0.01") BigDecimal financedAmount,
            @NotNull LocalDate saleDate
    ) {
    }
}

