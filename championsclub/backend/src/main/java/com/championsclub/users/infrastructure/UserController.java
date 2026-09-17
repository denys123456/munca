package com.championsclub.users.infrastructure;
import com.championsclub.users.application.*;
import com.championsclub.users.domain.UserRole;
import com.championsclub.common.application.Pages;
import com.championsclub.security.application.Access;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
class UserController {
    private final UserStore users;
    private final UserCommands commands;
    private final AdvisorQueries advisors;
    UserController(UserStore users, UserCommands commands, AdvisorQueries advisors) {
        this.users = users; this.commands = commands; this.advisors = advisors;
    }
    @GetMapping("/api/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    Page<UserAccount> users(@RequestParam(defaultValue="") String search, @RequestParam(required=false) Long dealershipId,
                           @RequestParam(required=false) UserRole role, @RequestParam(defaultValue="0") int page,
                           @RequestParam(defaultValue="20") int size) { return users.search(search, dealershipId, role, Pages.of(page, size)); }
    @GetMapping("/api/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    UserAccount user(@PathVariable long id) { return users.get(id); }
    @PostMapping("/api/admin/users")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    UserAccount create(@Valid @RequestBody UserRequest request) { return commands.save(null, request.change()); }
    @PutMapping("/api/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    UserAccount update(@PathVariable long id, @Valid @RequestBody UserRequest request) { return commands.save(id, request.change()); }
    @PatchMapping("/api/admin/users/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    UserAccount active(@PathVariable long id, @Valid @RequestBody ActiveRequest request) { return commands.active(id, request.active()); }
    @GetMapping("/api/advisors")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    Page<UserAccount> advisors(@RequestParam(defaultValue="") String search, @RequestParam(required=false) Long dealershipId,
                              @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return advisors.list(search,dealershipId,Pages.of(page,size));
    }
    record ActiveRequest(@NotNull Boolean active) {}
    record UserRequest(@NotBlank @Size(max=80) String firstName, @NotBlank @Size(max=80) String lastName,
                       @NotBlank @Size(max=160) String email, @NotNull UserRole role, @Positive Long dealershipId,
                       boolean active, @Size(max=72) String password) {
        UserStore.UserChange change() { return new UserStore.UserChange(firstName, lastName, email, role, dealershipId, active, password); }
    }
}
