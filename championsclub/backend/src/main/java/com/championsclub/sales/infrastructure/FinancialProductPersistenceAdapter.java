package com.championsclub.sales.infrastructure;

import com.championsclub.sales.application.FinancialProductRepository;
import com.championsclub.sales.domain.FinancialProduct;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
class FinancialProductPersistenceAdapter implements FinancialProductRepository {

    private final JpaFinancialProductRepository jpaFinancialProductRepository;

    FinancialProductPersistenceAdapter(JpaFinancialProductRepository jpaFinancialProductRepository) {
        this.jpaFinancialProductRepository = jpaFinancialProductRepository;
    }

    @Override
    public FinancialProduct save(FinancialProduct product) {
        return jpaFinancialProductRepository.save(FinancialProductEntity.fromDomain(product)).toDomain();
    }

    @Override
    public Optional<FinancialProduct> findById(Long productId) {
        return jpaFinancialProductRepository.findById(productId).map(FinancialProductEntity::toDomain);
    }
}
