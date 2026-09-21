package com.championsclub.users.domain;

import java.util.Objects;

public class User {

    private final Long id;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final Long dealershipId;
    private final UserRole role;
    private final AdvisorType advisorType;
    private final UserStatus status;

    private User(Builder builder) {
        this.id = builder.id;
        this.firstName = requireText(builder.firstName);
        this.lastName = requireText(builder.lastName);
        this.email = requireText(builder.email);
        this.dealershipId = requireDealership(builder.dealershipId);
        this.role = requireValue(builder.role);
        this.advisorType = builder.advisorType;
        this.status = builder.status == null ? UserStatus.ACTIVE : builder.status;
        validateAdvisorType();
    }

    public static Builder builder() {
        return new Builder();
    }

    public String displayName() {
        return firstName + " " + lastName;
    }

    public boolean canManageDealership(Long requestedDealershipId) {
        return role == UserRole.MANAGER && Objects.equals(dealershipId, requestedDealershipId);
    }

    public boolean isAdvisor() {
        return role == UserRole.ADVISOR;
    }

    public Long id() {
        return id;
    }

    public String firstName() {
        return firstName;
    }

    public String lastName() {
        return lastName;
    }

    public String email() {
        return email;
    }

    public Long dealershipId() {
        return dealershipId;
    }

    public UserRole role() {
        return role;
    }

    public AdvisorType advisorType() {
        return advisorType;
    }

    public UserStatus status() {
        return status;
    }

    private void validateAdvisorType() {
        if (role == UserRole.ADVISOR && advisorType == null) {
            throw new IllegalArgumentException("Advisors require an advisor type.");
        }
        if (role == UserRole.MANAGER && advisorType != null) {
            throw new IllegalArgumentException("Managers cannot have an advisor type.");
        }
    }

    private static String requireText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("User values must be provided.");
        }
        return value.trim();
    }

    private static Long requireDealership(Long value) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException("Users require a dealership.");
        }
        return value;
    }

    private static UserRole requireValue(UserRole value) {
        if (value == null) {
            throw new IllegalArgumentException("User role must be provided.");
        }
        return value;
    }

    public static final class Builder {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private Long dealershipId;
        private UserRole role;
        private AdvisorType advisorType;
        private UserStatus status;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder dealershipId(Long dealershipId) {
            this.dealershipId = dealershipId;
            return this;
        }

        public Builder role(UserRole role) {
            this.role = role;
            return this;
        }

        public Builder advisorType(AdvisorType advisorType) {
            this.advisorType = advisorType;
            return this;
        }

        public Builder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public User build() {
            return new User(this);
        }
    }
}
