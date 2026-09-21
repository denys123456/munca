package com.championsclub.users.application;

import com.championsclub.users.domain.AdvisorType;
import com.championsclub.users.domain.UserRole;
import java.time.Instant;

public record UserAccount(
        Long id,
        String firstName,
        String lastName,
        String email,
        UserRole role,
        AdvisorType advisorType,
        Long dealershipId,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public String displayName() {
        return firstName + " " + lastName;
    }
}
