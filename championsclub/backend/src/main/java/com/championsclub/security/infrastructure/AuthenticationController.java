package com.championsclub.security.infrastructure;
import com.championsclub.security.application.AuthenticationService;
import com.championsclub.users.application.UserAccount;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
@RestController
class AuthenticationController {
    private final AuthenticationService authentication;
    AuthenticationController(AuthenticationService authentication) { this.authentication = authentication; }
    @PostMapping("/api/auth/login")
    AuthenticationService.LoginResult login(@Valid @RequestBody LoginRequest request) {
        return authentication.login(request.email(), request.password());
    }
    @GetMapping("/api/me")
    UserAccount current() { return authentication.current(); }
    @PostMapping("/api/auth/logout")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    void logout() { authentication.logout(); }
    record LoginRequest(@NotBlank @Size(max = 160) String email, @NotBlank @Size(max = 72) String password) {}
}
