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
    private final com.championsclub.sales.application.CancelSaleCommandHandler cancellations;
    private final com.championsclub.sales.application.SalesQueries queries;

    SalesController(CreateSaleCommandHandler createSaleCommandHandler, com.championsclub.sales.application.CancelSaleCommandHandler cancellations,
                    com.championsclub.sales.application.SalesQueries queries) {
        this.createSaleCommandHandler = createSaleCommandHandler;
        this.cancellations = cancellations;
        this.queries = queries;
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
                request.saleDate(), request.externalReference(), request.currency()
        ));
    }

    record CreateSaleRequest(
            @NotNull @Positive Long advisorId,
            @NotNull @Positive Long dealershipId,
            @NotNull @Positive Long productId,
            @NotNull @DecimalMin("0.01") @jakarta.validation.constraints.Digits(integer=12,fraction=2) BigDecimal financedAmount,
            @NotNull LocalDate saleDate,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=160) String externalReference,
            @jakarta.validation.constraints.NotBlank String currency
    ) {
    }
    @PostMapping("/{id}/cancel")
    SaleResponse cancel(@org.springframework.web.bind.annotation.PathVariable long id) { return cancellations.cancel(id); }
    @org.springframework.web.bind.annotation.GetMapping
    org.springframework.data.domain.Page<SaleResponse> history(
            @org.springframework.web.bind.annotation.RequestParam(required=false) Long advisorId,
            @org.springframework.web.bind.annotation.RequestParam(required=false) Long dealershipId,
            @org.springframework.web.bind.annotation.RequestParam(required=false) Long productId,
            @org.springframework.web.bind.annotation.RequestParam(required=false) com.championsclub.sales.domain.SaleStatus status,
            @org.springframework.web.bind.annotation.RequestParam(required=false) LocalDate from,
            @org.springframework.web.bind.annotation.RequestParam(required=false) LocalDate to,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue="0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue="20") int size) {
        return queries.history(new com.championsclub.sales.application.SaleRepository.SalesFilter(advisorId, dealershipId, productId, status, from, to),
                com.championsclub.common.application.Pages.of(page, size));
    }
}
