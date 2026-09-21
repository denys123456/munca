package com.championsclub.users.infrastructure;

import com.championsclub.common.application.ResourceNotFoundException;
import com.championsclub.users.application.UserAccount;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
class JpaUserStore implements UserStore {
    private final JpaUserRepository repository;

    JpaUserStore(JpaUserRepository repository) {
        this.repository = repository;
    }

    public Optional<Credentials> credentials(String email) {
        return repository.findByEmailIgnoreCase(email)
                .map(user -> new Credentials(user.account(), user.passwordHash, user.tokenVersion));
    }

    public UserAccount get(long id) {
        return repository.findById(id).orElseThrow(this::missing).account();
    }

    public UserAccount lock(long id) {
        return repository.lock(id).orElseThrow(this::missing).account();
    }

    public Page<UserAccount> search(String search, Long dealershipId, UserRole role, Pageable page) {
        return repository.findAll((root, query, builder) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            String term = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
            if (!term.isEmpty()) {
                predicates.add(builder.or(
                        builder.gt(builder.locate(builder.lower(root.get("firstName")), term), 0),
                        builder.gt(builder.locate(builder.lower(root.get("lastName")), term), 0),
                        builder.gt(builder.locate(builder.lower(root.get("email")), term), 0)
                ));
            }
            if (dealershipId != null) {
                predicates.add(builder.equal(root.get("dealershipId"), dealershipId));
            }
            if (role != null) {
                predicates.add(builder.equal(root.get("role"), role));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        }, page).map(UserEntity::account);
    }

    public UserAccount save(Long id, UserChange change, String passwordHash) {
        UserEntity entity = id == null ? new UserEntity() : repository.lock(id).orElseThrow(this::missing);
        if (id == null) {
            entity.createdAt = Instant.now();
        } else {
            entity.tokenVersion++;
        }
        entity.firstName = change.firstName().trim();
        entity.lastName = change.lastName().trim();
        entity.email = change.email().trim().toLowerCase(Locale.ROOT);
        entity.role = change.role();
        entity.advisorType = change.advisorType();
        entity.dealershipId = change.dealershipId();
        entity.status = change.active() ? "ACTIVE" : "INACTIVE";
        if (passwordHash != null) {
            entity.passwordHash = passwordHash;
        }
        entity.updatedAt = Instant.now();
        return repository.saveAndFlush(entity).account();
    }

    public void revokeTokens(long id) {
        UserEntity entity = repository.lock(id).orElseThrow(this::missing);
        entity.tokenVersion++;
        repository.saveAndFlush(entity);
    }

    private ResourceNotFoundException missing() {
        return new ResourceNotFoundException("USER_NOT_FOUND", "The requested user could not be found.");
    }
}
