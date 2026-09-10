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
    private int pointsPerThousandEuro;

    @Column(nullable = false)
    private boolean eligible;

    protected FinancialProductEntity() {
    }

    private FinancialProductEntity(FinancialProduct product) {
        this.id = product.id();
        this.name = product.name();
        this.pointsPerThousandEuro = product.pointsPerThousandEuro();
        this.eligible = product.isEligible();
    }

    static FinancialProductEntity fromDomain(FinancialProduct product) {
        return new FinancialProductEntity(product);
    }

    FinancialProduct toDomain() {
        return FinancialProduct.builder()
                .id(id)
                .name(name)
                .pointsPerThousandEuro(pointsPerThousandEuro)
                .eligible(eligible)
                .build();
    }
}
