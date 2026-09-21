package com.championsclub.sales.domain;

import com.championsclub.users.domain.AdvisorType;

public class FinancialProduct {
    private final Long id;
    private final String name;
    private final String code;
    private final String description;
    private final ProductCategory category;
    private final boolean active;
    private final boolean eligible;
    private final ProductAdvisorScope advisorScope;

    private FinancialProduct(Builder builder) {
        this.id = builder.id;
        this.name = requireText(builder.name);
        this.code = requireText(builder.code);
        this.description = builder.description == null ? "" : builder.description.trim();
        this.category = builder.category == null ? ProductCategory.OTHER : builder.category;
        this.active = builder.active;
        this.eligible = builder.eligible;
        this.advisorScope = builder.advisorScope == null ? ProductAdvisorScope.BOTH : builder.advisorScope;
    }

    public static Builder builder() {
        return new Builder();
    }

    public boolean acceptsSale(AdvisorType advisorType) {
        return active && eligible && advisorScope.supports(advisorType);
    }

    public Long id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String code() {
        return code;
    }

    public String description() {
        return description;
    }

    public ProductCategory category() {
        return category;
    }

    public boolean active() {
        return active;
    }

    public boolean isEligible() {
        return eligible;
    }

    public ProductAdvisorScope advisorScope() {
        return advisorScope;
    }

    private static String requireText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Financial product values must be provided.");
        }
        return value.trim();
    }

    public static final class Builder {
        private Long id;
        private String name;
        private String code;
        private String description = "";
        private ProductCategory category = ProductCategory.OTHER;
        private boolean active = true;
        private boolean eligible = true;
        private ProductAdvisorScope advisorScope = ProductAdvisorScope.BOTH;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder category(ProductCategory category) {
            this.category = category;
            return this;
        }

        public Builder active(boolean active) {
            this.active = active;
            return this;
        }

        public Builder eligible(boolean eligible) {
            this.eligible = eligible;
            return this;
        }

        public Builder advisorScope(ProductAdvisorScope advisorScope) {
            this.advisorScope = advisorScope;
            return this;
        }

        public FinancialProduct build() {
            return new FinancialProduct(this);
        }
    }
}
