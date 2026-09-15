package com.championsclub.users.infrastructure;
import com.championsclub.users.application.UserAccount;
import com.championsclub.users.domain.UserRole;
import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name = "users")
class UserEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String firstName;
    String lastName;
    String email;
    String passwordHash;
    @Enumerated(EnumType.STRING)
    UserRole role;
    Long dealershipId;
    String status;
    long tokenVersion;
    Instant createdAt;
    Instant updatedAt;
    protected UserEntity() {}
    UserAccount account() {
        return new UserAccount(id, firstName, lastName, email, role, dealershipId,
                "ACTIVE".equals(status), createdAt, updatedAt);
    }
}
