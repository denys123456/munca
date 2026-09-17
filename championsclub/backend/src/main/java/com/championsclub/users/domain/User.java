package com.championsclub.users.domain;

public class User {

    private final Long id;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final Long dealershipId;
    private final UserRole role;
    private final UserStatus status;

    private User(Builder builder) {
        this.id = builder.id;
        this.firstName = requireText(builder.firstName);
        this.lastName = requireText(builder.lastName);
        this.email = requireText(builder.email);
        this.dealershipId = builder.dealershipId;
        this.role = requireValue(builder.role);
        this.status = builder.status == null ? UserStatus.ACTIVE : builder.status;
        if (role != UserRole.ADMIN && (dealershipId == null || dealershipId <= 0))
            throw new IllegalArgumentException("Advisors and managers require a dealership.");
    }

    public static Builder builder() {
        return new Builder();
    }

    public String displayName() {
        return firstName + " " + lastName;
    }

    public boolean canManageDealership(Long requestedDealershipId) {
        return role == UserRole.ADMIN || role == UserRole.MANAGER && java.util.Objects.equals(dealershipId,requestedDealershipId);
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

    public UserStatus status() {
        return status;
    }

    private static String requireText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("User values must be provided.");
        }
        return value.trim();
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

        public Builder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public User build() {
            return new User(this);
        }
    }
}
