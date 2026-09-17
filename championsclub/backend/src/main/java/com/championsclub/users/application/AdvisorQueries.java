package com.championsclub.users.application;
import com.championsclub.security.application.Access;
import com.championsclub.users.domain.UserRole;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
@Service
public class AdvisorQueries {
    private final UserStore users;
    private final Access access;
    public AdvisorQueries(UserStore users,Access access) { this.users=users; this.access=access; }
    public Page<UserAccount> list(String search,Long dealershipId,Pageable page) {
        var actor=access.current();
        if (actor.role() == UserRole.SALES_ADVISOR) throw new org.springframework.security.access.AccessDeniedException("Access denied.");
        Long scope=actor.role() == UserRole.MANAGER ? actor.dealershipId() : dealershipId;
        if (dealershipId != null) access.dealership(dealershipId);
        return users.search(search,scope,UserRole.SALES_ADVISOR,page);
    }
}
