package com.championsclub.sales.infrastructure;

import com.championsclub.sales.domain.FinancialProduct;
import com.championsclub.sales.domain.ProductAdvisorScope;
import com.championsclub.sales.domain.ProductCategory;

record ProductResponse(
        Long id,
        String name,
        String code,
        String description,
        ProductCategory category,
        boolean active,
        boolean eligible,
        ProductAdvisorScope advisorScope
) {
    static ProductResponse from(FinancialProduct product) {
        return new ProductResponse(
                product.id(),
                product.name(),
                product.code(),
                product.description(),
                product.category(),
                product.active(),
                product.isEligible(),
                product.advisorScope()
        );
    }
}
