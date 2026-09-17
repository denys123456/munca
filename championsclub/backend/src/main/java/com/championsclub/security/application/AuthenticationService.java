package com.championsclub.security.application;
import com.championsclub.users.application.*;
import java.time.Instant;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class AuthenticationService {
    private final UserStore users;
    private final PasswordEncoder passwords;
    private final JwtEncoder encoder;
    private final Access access;
    private final String missingAccountHash;
    public AuthenticationService(UserStore users, PasswordEncoder passwords, JwtEncoder encoder, Access access) {
        this.users = users;
        this.passwords = passwords;
        this.encoder = encoder;
        this.access = access;
        this.missingAccountHash = passwords.encode(java.util.UUID.randomUUID().toString());
    }
    public LoginResult login(String email, String password) {
        var credentials = users.credentials(email.trim());
        boolean matches = passwords.matches(password, credentials.map(UserStore.Credentials::passwordHash).orElse(missingAccountHash));
        if (!matches || credentials.isEmpty() || !credentials.get().account().active())
            throw new BadCredentialsException("Invalid email or password.");
        var account = credentials.get().account();
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(1800);
        var claims = JwtClaimsSet.builder().issuer("championsclub").subject(account.email())
                .issuedAt(now).expiresAt(expiresAt).claim("version", credentials.get().tokenVersion()).build();
        String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new LoginResult(token, "Bearer", expiresAt, account);
    }
    @Transactional
    public void logout() { users.revokeTokens(access.current().id()); }
    public UserAccount current() { return access.current(); }
    public record LoginResult(String accessToken, String tokenType, Instant expiresAt, UserAccount user) {}
}
