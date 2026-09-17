package com.championsclub.sales.infrastructure;

import com.championsclub.sales.domain.FinancialProduct;
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

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;
    private String description;
    private boolean active;
    @org.hibernate.annotations.UpdateTimestamp
    private java.time.Instant updatedAt;

    @Column(nullable = false)
    private boolean eligible;

    protected FinancialProductEntity() {
    }

    private FinancialProductEntity(FinancialProduct product) {
        this.id = product.id();
        this.name = product.name();
        this.code = product.code();
        this.description = product.description();
        this.active = product.active();
        this.eligible = product.isEligible();
    }

    static FinancialProductEntity fromDomain(FinancialProduct product) {
        return new FinancialProductEntity(product);
    }

    FinancialProduct toDomain() {
        return FinancialProduct.builder()
                .id(id)
                .name(name)
                .code(code).description(description).active(active)
                .eligible(eligible)
                .build();
    }
}
