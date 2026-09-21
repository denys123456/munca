package com.championsclub.security.infrastructure;

import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserAccount;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
class DatabaseAccess implements Access {
    private final UserStore users;

    DatabaseAccess(UserStore users) {
        this.users = users;
    }

    public UserAccount current() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw denied();
        }
        return users.credentials(authentication.getName())
                .map(UserStore.Credentials::account)
                .filter(UserAccount::active)
                .orElseThrow(this::denied);
    }

    public void advisor(long advisorId) {
        var actor = current();
        var advisor = users.get(advisorId);
        if (advisor.role() != UserRole.ADVISOR) {
            throw denied();
        }
        if (actor.role() == UserRole.ADVISOR && Objects.equals(actor.id(), advisor.id())) {
            return;
        }
        if (actor.role() == UserRole.MANAGER && Objects.equals(actor.dealershipId(), advisor.dealershipId())) {
            return;
        }
        throw denied();
    }

    public void dealership(long dealershipId) {
        var actor = current();
        if (actor.role() == UserRole.MANAGER && Objects.equals(actor.dealershipId(), dealershipId)) {
            return;
        }
        throw denied();
    }

    public void self(long userId) {
        if (!Objects.equals(current().id(), userId)) {
            throw denied();
        }
    }

    public void manager() {
        if (current().role() != UserRole.MANAGER) {
            throw denied();
        }
    }

    private AccessDeniedException denied() {
        return new AccessDeniedException("Access denied.");
    }
}
