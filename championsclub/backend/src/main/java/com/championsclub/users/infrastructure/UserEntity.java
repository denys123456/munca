package com.championsclub.users.infrastructure;

import com.championsclub.users.application.UserAccount;
import com.championsclub.users.domain.AdvisorType;
import com.championsclub.users.domain.UserRole;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String firstName;
    String lastName;
    String email;
    String passwordHash;
    @Enumerated(EnumType.STRING)
    UserRole role;
    @Enumerated(EnumType.STRING)
    AdvisorType advisorType;
    Long dealershipId;
    String status;
    long tokenVersion;
    Instant createdAt;
    Instant updatedAt;

    protected UserEntity() {
    }

    UserAccount account() {
        return new UserAccount(
                id,
                firstName,
                lastName,
                email,
                role,
                advisorType,
                dealershipId,
                "ACTIVE".equals(status),
                createdAt,
                updatedAt
        );
    }
}
