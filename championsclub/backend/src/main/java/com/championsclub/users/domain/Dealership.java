package com.championsclub.users.domain;

import java.util.Objects;

public class Dealership {

    private final Long id;
    private final String name;
    private final String city;
    private final String region;

    private Dealership(Builder builder) {
        this.id = builder.id;
        this.name = requireText(builder.name);
        this.city = requireText(builder.city);
        this.region = requireText(builder.region);
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String city() {
        return city;
    }

    public String region() {
        return region;
    }

    private static String requireText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Dealership values must be provided.");
        }
        return value.trim();
    }

    public static final class Builder {
        private Long id;
        private String name;
        private String city;
        private String region;

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

        public Builder city(String city) {
            this.city = city;
            return this;
        }

        public Builder region(String region) {
            this.region = region;
            return this;
        }

        public Dealership build() {
            return new Dealership(this);
        }
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof Dealership dealership)) {
            return false;
        }
        return Objects.equals(id, dealership.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

