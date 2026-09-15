package com.championsclub.users.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.audit.application.AuditLog;
import com.championsclub.security.application.Access;
import com.championsclub.users.domain.UserRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class UserCommands {
    private final UserStore users;
    private final ConfigurationStore configuration;
    private final PasswordEncoder passwords;
    private final Access access;
    private final AuditLog audit;
    public UserCommands(UserStore users, ConfigurationStore configuration, PasswordEncoder passwords, Access access, AuditLog audit) {
        this.users = users; this.configuration = configuration; this.passwords = passwords; this.access = access; this.audit = audit;
    }
    @Transactional
    public UserAccount save(Long id, UserStore.UserChange change) {
        access.admin();
        if (id != null && id.equals(access.current().id()) && (!change.active() || change.role() != UserRole.ADMIN))
            throw new IllegalArgumentException("You cannot disable or demote your own administrator account.");
        if (change.role() != UserRole.ADMIN && change.dealershipId() == null)
            throw new IllegalArgumentException("Advisors and managers require a dealership.");
        if (change.dealershipId() != null && !configuration.dealership(change.dealershipId()).active())
            throw new IllegalArgumentException("The dealership must be active.");
        validateEmail(change.email());
        com.championsclub.users.domain.User.builder().id(id).firstName(change.firstName()).lastName(change.lastName())
                .email(change.email()).role(change.role()).dealershipId(change.dealershipId()).build();
        if (id == null && change.password() == null) throw new IllegalArgumentException("A password is required.");
        String passwordHash = null;
        if (change.password() != null) {
            int length = change.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
            if (length < 12 || length > 72) throw new IllegalArgumentException("Passwords must contain between 12 and 72 UTF-8 bytes.");
            passwordHash = passwords.encode(change.password());
        }
        var result = users.save(id, change, passwordHash);
        audit.record(access.current().id(), id == null ? "USER_CREATED" : "USER_UPDATED", "USER", result.id());
        return result;
    }
    @Transactional
    public UserAccount active(long id, boolean active) {
        access.admin();
        var user = users.lock(id);
        if (id == access.current().id() && !active) throw new IllegalArgumentException("You cannot disable your own account.");
        var result = users.save(id, new UserStore.UserChange(user.firstName(), user.lastName(), user.email(), user.role(),
                user.dealershipId(), active, null), null);
        audit.record(access.current().id(), active ? "USER_ACTIVATED" : "USER_DISABLED", "USER", id);
        return result;
    }
    private void validateEmail(String email) {
        int separator = email.indexOf('@');
        if (separator <= 0 || separator != email.lastIndexOf('@') || separator >= email.length() - 3
                || email.indexOf('.', separator) <= separator + 1 || email.endsWith(".")
                || email.chars().anyMatch(c -> Character.isWhitespace(c) || Character.isISOControl(c)))
            throw new IllegalArgumentException("A valid email address is required.");
    }
}
