package com.championsclub.admin.infrastructure;

import com.championsclub.rewards.application.CreateRewardCommand;
import com.championsclub.rewards.application.CreateRewardCommandHandler;
import com.championsclub.rewards.application.RewardCatalogItem;
import com.championsclub.sales.application.CreateFinancialProductCommand;
import com.championsclub.sales.application.CreateFinancialProductCommandHandler;
import com.championsclub.sales.application.FinancialProductResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/catalog")
@PreAuthorize("hasRole('ADMIN')")
class AdminCatalogController {

    private final CreateFinancialProductCommandHandler createFinancialProductCommandHandler;
    private final CreateRewardCommandHandler createRewardCommandHandler;

    AdminCatalogController(
            CreateFinancialProductCommandHandler createFinancialProductCommandHandler,
            CreateRewardCommandHandler createRewardCommandHandler
    ) {
        this.createFinancialProductCommandHandler = createFinancialProductCommandHandler;
        this.createRewardCommandHandler = createRewardCommandHandler;
    }

    @PostMapping("/financial-products")
    @ResponseStatus(HttpStatus.CREATED)
    FinancialProductResponse createFinancialProduct(@Valid @RequestBody CreateFinancialProductRequest request) {
        return createFinancialProductCommandHandler.createFinancialProduct(new CreateFinancialProductCommand(
                request.name(),
                request.pointsPerThousandEuro(),
                request.isEligible()
        ));
    }

    @PostMapping("/rewards")
    @ResponseStatus(HttpStatus.CREATED)
    RewardCatalogItem createReward(@Valid @RequestBody CreateRewardRequest request) {
        return createRewardCommandHandler.createReward(new CreateRewardCommand(
                request.name(),
                request.category(),
                request.requiredPoints()
        ));
    }

    record CreateFinancialProductRequest(
            @NotBlank String name,
            @Min(1) int pointsPerThousandEuro,
            boolean isEligible
    ) {
    }

    record CreateRewardRequest(
            @NotBlank String name,
            @NotBlank String category,
            @Min(1) int requiredPoints
    ) {
    }
}

