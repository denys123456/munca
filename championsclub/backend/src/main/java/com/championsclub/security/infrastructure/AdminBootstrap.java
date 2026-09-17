package com.championsclub.security.infrastructure;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import com.championsclub.audit.application.AuditLog;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
@Component
@ConditionalOnProperty(name="championsclub.bootstrap.enabled",havingValue="true")
class AdminBootstrap implements ApplicationRunner {
    private final UserStore users;
    private final JdbcTemplate database;
    private final PasswordEncoder encoder;
    private final AuditLog audit;
    private final String email;
    private final String password;
    AdminBootstrap(UserStore users,JdbcTemplate database,PasswordEncoder encoder,AuditLog audit,
                   @Value("${championsclub.bootstrap.email}") String email,@Value("${championsclub.bootstrap.password}") String password) {
        this.users=users; this.database=database; this.encoder=encoder; this.audit=audit; this.email=email; this.password=password;
    }
    @Transactional
    public void run(ApplicationArguments arguments) {
        database.execute("select pg_advisory_xact_lock(724315)");
        if (database.queryForObject("select count(*) from users",Long.class)>0) return;
        int bytes=password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        if (bytes<12 || bytes>72 || email.indexOf('@')<=0 || email.endsWith("@"))
            throw new IllegalStateException("Bootstrap requires a valid email and a password between 12 and 72 UTF-8 bytes.");
        var user=users.save(null,new UserStore.UserChange("System","Administrator",email,UserRole.ADMIN,null,true,null),encoder.encode(password));
        audit.record(user.id(),"USER_CREATED","USER",user.id());
    }
}
