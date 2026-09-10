package com.championsclub.sales.application;

import com.championsclub.sales.domain.FinancialProduct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateFinancialProductCommandHandler {

    private final FinancialProductRepository financialProductRepository;

    public CreateFinancialProductCommandHandler(FinancialProductRepository financialProductRepository) {
        this.financialProductRepository = financialProductRepository;
    }

    @Transactional
    public FinancialProductResponse createFinancialProduct(CreateFinancialProductCommand command) {
        FinancialProduct product = FinancialProduct.builder()
                .name(command.name())
                .pointsPerThousandEuro(command.pointsPerThousandEuro())
                .eligible(command.isEligible())
                .build();
        FinancialProduct savedProduct = financialProductRepository.save(product);
        return new FinancialProductResponse(
                savedProduct.id(),
                savedProduct.name(),
                savedProduct.pointsPerThousandEuro(),
                savedProduct.isEligible()
        );
    }
}

