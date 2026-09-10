package com.championsclub.sales.application;

import com.championsclub.sales.domain.FinancialProduct;

import java.util.Optional;

public interface FinancialProductRepository {

    FinancialProduct save(FinancialProduct product);

    Optional<FinancialProduct> findById(Long productId);
}
