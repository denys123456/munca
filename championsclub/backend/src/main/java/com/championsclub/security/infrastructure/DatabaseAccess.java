package com.championsclub.security.infrastructure;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.*;
import com.championsclub.users.domain.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
@Component
class DatabaseAccess implements Access {
    private final UserStore users;
    DatabaseAccess(UserStore users) { this.users = users; }
    public UserAccount current() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) throw denied();
        return users.credentials(authentication.getName()).map(UserStore.Credentials::account)
                .filter(UserAccount::active).orElseThrow(this::denied);
    }
    public void advisor(long advisorId) {
        var actor = current();
        var advisor = users.get(advisorId);
        if (advisor.role() != UserRole.SALES_ADVISOR) throw denied();
        if (actor.role() == UserRole.ADMIN || actor.id() == advisorId) return;
        if (actor.role() == UserRole.MANAGER && actor.dealershipId().equals(advisor.dealershipId())) return;
        throw denied();
    }
    public void dealership(long dealershipId) {
        var actor = current();
        if (actor.role() == UserRole.ADMIN) return;
        if (actor.role() == UserRole.MANAGER && actor.dealershipId() == dealershipId) return;
        throw denied();
    }
    public void self(long userId) { if (current().id() != userId) throw denied(); }
    public void admin() { if (current().role() != UserRole.ADMIN) throw denied(); }
    private AccessDeniedException denied() { return new AccessDeniedException("Access denied."); }
}
