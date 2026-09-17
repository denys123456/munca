package com.championsclub.sales.domain;

import java.math.BigDecimal;

public class FinancialProduct {

    private final Long id;
    private final String name;
    private final String code;
    private final String description;
    private final boolean active;
    private final boolean isEligible;

    private FinancialProduct(Builder builder) {
        this.id = builder.id;
        this.name = requireText(builder.name);
        this.code = requireText(builder.code);
        this.description = builder.description;
        this.active = builder.active;
        this.isEligible = builder.isEligible;
    }

    public static Builder builder() {
        return new Builder();
    }

    public boolean acceptsSale() { return active && isEligible; }
    public String code() { return code; }
    public String description() { return description; }
    public boolean active() { return active; }

    public Long id() {
        return id;
    }

    public String name() {
        return name;
    }


    public boolean isEligible() {
        return isEligible;
    }

    private static String requireText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Financial product name must be provided.");
        }
        return value.trim();
    }


    public static final class Builder {
        private Long id;
        private String name;
        private String code;
        private String description = "";
        private boolean active = true;
        public Builder code(String code) { this.code=code; return this; }
        public Builder description(String description) { this.description=description; return this; }
        public Builder active(boolean active) { this.active=active; return this; }
        private boolean isEligible = true;

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


        public Builder eligible(boolean eligible) {
            isEligible = eligible;
            return this;
        }

        public FinancialProduct build() {
            return new FinancialProduct(this);
        }
    }
}
