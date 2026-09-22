package com.championsclub.security.infrastructure;
import com.championsclub.users.application.UserStore;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
@Configuration
@EnableMethodSecurity
class SecurityConfiguration {
    @Bean
    SecretKeySpec signingKey(@Value("${championsclub.security.jwt-secret}") String secret) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalStateException("JWT secret must contain at least 32 bytes.");
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }
    @Bean
    JwtEncoder jwtEncoder(SecretKeySpec key) { return new NimbusJwtEncoder(new ImmutableSecret<>(key)); }
    @Bean
    JwtDecoder jwtDecoder(SecretKeySpec key, UserStore users) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> accountValidator = jwt -> {
            var credentials = users.credentials(jwt.getSubject());
            Number version = jwt.getClaim("version");
            if (credentials.isPresent() && credentials.get().account().active() && version != null
                    && credentials.get().tokenVersion() == version.longValue())
                return OAuth2TokenValidatorResult.success();
            return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer("championsclub"), accountValidator));
        return decoder;
    }
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, UserStore users,com.fasterxml.jackson.databind.ObjectMapper json) throws Exception {
        return http.cors(Customizer.withDefaults()).csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(request -> request
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/actuator/health").permitAll()
                        .requestMatchers("/api/auth/login").permitAll().anyRequest().authenticated())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> error(response,request,json,401,"AUTHENTICATION_REQUIRED"))
                        .accessDeniedHandler((request, response, exception) -> error(response,request,json,403,"ACCESS_DENIED")))
                .oauth2ResourceServer(resource -> resource
                        .authenticationEntryPoint((request, response, exception) -> error(response,request,json,401,"INVALID_TOKEN"))
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(token -> {
                            var account = users.credentials(token.getSubject()).orElseThrow().account();
                            return new JwtAuthenticationToken(token,
                                    List.of(new SimpleGrantedAuthority("ROLE_" + account.role().name())), account.email());
                        })))
                .build();
    }
    private void error(HttpServletResponse response,jakarta.servlet.http.HttpServletRequest request,com.fasterxml.jackson.databind.ObjectMapper json,
                       int status,String code) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        json.writeValue(response.getOutputStream(),new com.championsclub.common.infrastructure.ErrorResponse(status,code,"Access denied.",
                java.time.Instant.now(),request.getRequestURI(),List.of()));
    }
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${championsclub.cors.allowed-origin}") List<String> origins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
