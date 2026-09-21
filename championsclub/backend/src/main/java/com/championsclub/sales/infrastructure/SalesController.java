package com.championsclub.sales.infrastructure;

import com.championsclub.common.application.Pages;
import com.championsclub.sales.application.CancelSaleCommandHandler;
import com.championsclub.sales.application.CreateSaleCommand;
import com.championsclub.sales.application.CreateSaleCommandHandler;
import com.championsclub.sales.application.SaleRepository;
import com.championsclub.sales.application.SaleResponse;
import com.championsclub.sales.application.SalesQueries;
import com.championsclub.sales.domain.SaleStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales")
class SalesController {
    private final CreateSaleCommandHandler createSaleCommandHandler;
    private final CancelSaleCommandHandler cancellations;
    private final SalesQueries queries;

    SalesController(
            CreateSaleCommandHandler createSaleCommandHandler,
            CancelSaleCommandHandler cancellations,
            SalesQueries queries
    ) {
        this.createSaleCommandHandler = createSaleCommandHandler;
        this.cancellations = cancellations;
        this.queries = queries;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADVISOR','MANAGER')")
    SaleResponse createSale(@Valid @RequestBody CreateSaleRequest request) {
        return createSaleCommandHandler.createSale(new CreateSaleCommand(
                request.advisorId(),
                request.dealershipId(),
                request.productId(),
                request.contractAmount(),
                request.saleDate(),
                request.externalReference(),
                request.currency()
        ));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADVISOR','MANAGER')")
    SaleResponse cancel(@PathVariable long id) {
        return cancellations.cancel(id);
    }

    @GetMapping
    Page<SaleResponse> history(
            @RequestParam(required = false) Long advisorId,
            @RequestParam(required = false) Long dealershipId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return queries.history(
                new SaleRepository.SalesFilter(advisorId, dealershipId, productId, status, from, to),
                Pages.of(page, size)
        );
    }

    record CreateSaleRequest(
            @NotNull @Positive Long advisorId,
            @NotNull @Positive Long dealershipId,
            @NotNull @Positive Long productId,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal contractAmount,
            @NotNull LocalDate saleDate,
            @NotBlank @Size(max = 160) String externalReference,
            @NotBlank @Size(min = 3, max = 3) String currency
    ) {
    }
}
