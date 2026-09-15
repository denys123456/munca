package com.championsclub.sales.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

interface JpaFinancialProductRepository extends JpaRepository<FinancialProductEntity, Long> {
    @org.springframework.data.jpa.repository.Query("select p from FinancialProductEntity p where locate(lower(:search),lower(p.name))>0")
    org.springframework.data.domain.Page<FinancialProductEntity> search(String search,org.springframework.data.domain.Pageable page);
}
