package com.championsclub.sales.application;

import com.championsclub.common.application.ResourceNotFoundException;
import com.championsclub.sales.domain.FinancialProduct;
import com.championsclub.sales.domain.Sale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateSaleCommandHandler {

    private final SaleRepository saleRepository;
    private final FinancialProductRepository financialProductRepository;

    public CreateSaleCommandHandler(
            SaleRepository saleRepository,
            FinancialProductRepository financialProductRepository
    ) {
        this.saleRepository = saleRepository;
        this.financialProductRepository = financialProductRepository;
    }

    @Transactional
    public SaleResponse createSale(CreateSaleCommand command) {
        FinancialProduct product = financialProductRepository.findById(command.productId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "FINANCIAL_PRODUCT_NOT_FOUND",
                        "The requested financial product could not be found."
                ));

        Sale sale = Sale.builder()
                .advisorId(command.advisorId())
                .dealershipId(command.dealershipId())
                .productId(command.productId())
                .financedAmount(command.financedAmount())
                .saleDate(command.saleDate())
                .awardedPoints(product.calculatePoints(command.financedAmount()))
                .build();

        Sale savedSale = saleRepository.save(sale);
        return new SaleResponse(
                savedSale.id(),
                savedSale.advisorId(),
                savedSale.dealershipId(),
                savedSale.productId(),
                savedSale.financedAmount(),
                savedSale.saleDate(),
                savedSale.awardedPoints()
        );
    }
}

