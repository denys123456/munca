package com.championsclub.dashboard.application;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import org.springframework.stereotype.Service;
@Service
public class GetManagerDashboardQueryHandler {
    private final Access access;
    private final UserStore users;
    private final DashboardAssembler assembler;
    public GetManagerDashboardQueryHandler(Access access,UserStore users,DashboardAssembler assembler) {
        this.access=access; this.users=users; this.assembler=assembler;
    }
    public ManagerDashboard getManagerDashboard(GetManagerDashboardQuery query) {
        access.dealership(query.dealershipId());
        if (access.current().role() != UserRole.ADMIN) access.self(query.managerId());
        var manager=users.get(query.managerId());
        if (manager.role() != UserRole.MANAGER || !query.dealershipId().equals(manager.dealershipId()))
            throw new org.springframework.security.access.AccessDeniedException("Manager does not belong to the requested dealership.");
        return assembler.manager(manager);
    }
}
