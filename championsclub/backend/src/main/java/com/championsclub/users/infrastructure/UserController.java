package com.championsclub.users.infrastructure;

import com.championsclub.common.application.Pages;
import com.championsclub.users.application.AdvisorQueries;
import com.championsclub.users.application.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
class UserController {
    private final AdvisorQueries advisors;

    UserController(AdvisorQueries advisors) {
        this.advisors = advisors;
    }

    @GetMapping("/api/advisors")
    @PreAuthorize("hasRole('MANAGER')")
    Page<UserAccount> advisors(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) Long dealershipId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return advisors.list(search, dealershipId, Pages.of(page, size));
    }
}
