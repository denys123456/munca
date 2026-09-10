package com.championsclub.sales.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

interface JpaFinancialProductRepository extends JpaRepository<FinancialProductEntity, Long> {
}

