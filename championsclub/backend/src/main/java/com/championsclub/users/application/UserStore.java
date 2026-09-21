package com.championsclub.users.application;

import com.championsclub.users.domain.AdvisorType;
import com.championsclub.users.domain.UserRole;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserStore {
    Optional<Credentials> credentials(String email);
    UserAccount get(long id);
    UserAccount lock(long id);
    Page<UserAccount> search(String search, Long dealershipId, UserRole role, Pageable page);
    UserAccount save(Long id, UserChange change, String passwordHash);
    void revokeTokens(long id);

    record Credentials(UserAccount account, String passwordHash, long tokenVersion) {
    }

    record UserChange(
            String firstName,
            String lastName,
            String email,
            UserRole role,
            AdvisorType advisorType,
            Long dealershipId,
            boolean active,
            String password
    ) {
    }
}
