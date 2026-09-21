package com.championsclub.dealerships.domain;

public class Dealership {
    private final Long id;
    private final String name;
    private final String code;
    private final String city;
    private final String region;
    private final boolean active;

    private Dealership(Builder builder) {
        this.id = builder.id;
        this.name = requireText(builder.name);
        this.code = requireText(builder.code);
        this.city = requireText(builder.city);
        this.region = requireText(builder.region);
        this.active = builder.active;
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

    public String code() {
        return code;
    }

    public String city() {
        return city;
    }

    public String region() {
        return region;
    }

    public boolean active() {
        return active;
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
        private String code;
        private String city;
        private String region;
        private boolean active = true;

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

        public Builder city(String city) {
            this.city = city;
            return this;
        }

        public Builder region(String region) {
            this.region = region;
            return this;
        }

        public Builder active(boolean active) {
            this.active = active;
            return this;
        }

        public Dealership build() {
            return new Dealership(this);
        }
    }
}
