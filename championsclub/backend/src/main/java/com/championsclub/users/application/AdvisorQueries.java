package com.championsclub.users.application;

import com.championsclub.security.application.Access;
import com.championsclub.users.domain.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AdvisorQueries {
    private final UserStore users;
    private final Access access;

    public AdvisorQueries(UserStore users, Access access) {
        this.users = users;
        this.access = access;
    }

    public Page<UserAccount> list(String search, Long dealershipId, Pageable page) {
        var actor = access.current();
        if (actor.role() != UserRole.MANAGER) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied.");
        }
        Long requestedDealershipId = dealershipId == null ? actor.dealershipId() : dealershipId;
        access.dealership(requestedDealershipId);
        return users.search(search, requestedDealershipId, UserRole.ADVISOR, page);
    }
}
