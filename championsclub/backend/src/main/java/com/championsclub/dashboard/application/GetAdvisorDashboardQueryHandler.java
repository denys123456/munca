package com.championsclub.dashboard.application;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserStore;
import org.springframework.stereotype.Service;
@Service
public class GetAdvisorDashboardQueryHandler {
    private final Access access;
    private final UserStore users;
    private final DashboardAssembler assembler;
    public GetAdvisorDashboardQueryHandler(Access access,UserStore users,DashboardAssembler assembler) {
        this.access=access; this.users=users; this.assembler=assembler;
    }
    public AdvisorDashboard getAdvisorDashboard(GetAdvisorDashboardQuery query) {
        access.advisor(query.advisorId());
        return assembler.advisor(users.get(query.advisorId()));
    }
}
