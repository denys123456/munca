package com.championsclub.sales.infrastructure;

import com.championsclub.sales.domain.FinancialProduct;
import com.championsclub.sales.domain.ProductAdvisorScope;
import com.championsclub.sales.domain.ProductCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "financial_products")
class FinancialProductEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String code;
    private String description;
    private boolean eligible;
    private boolean active;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductCategory category;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductAdvisorScope advisorScope;

    protected FinancialProductEntity() {
    }

    private FinancialProductEntity(FinancialProduct product) {
        this.id = product.id();
        this.name = product.name();
        this.code = product.code();
        this.description = product.description();
        this.eligible = product.isEligible();
        this.active = product.active();
        this.category = product.category();
        this.advisorScope = product.advisorScope();
    }

    static FinancialProductEntity fromDomain(FinancialProduct product) {
        return new FinancialProductEntity(product);
    }

    FinancialProduct toDomain() {
        return FinancialProduct.builder()
                .id(id)
                .name(name)
                .code(code)
                .description(description)
                .category(category)
                .eligible(eligible)
                .active(active)
                .advisorScope(advisorScope)
                .build();
    }
}
