package com.championsclub.alerts.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.dashboard.application.*;
import com.championsclub.common.application.Pages;
import com.championsclub.users.application.*;
import com.championsclub.users.domain.UserRole;
import org.springframework.stereotype.Service;
@Service
public class PerformanceRefresh {
    private final UserStore users;
    private final PerformanceFactsService facts;
    private final ConfigurationStore configuration;
    private final AlertEvaluator alerts;
    private final DashboardAssembler dashboards;
    public PerformanceRefresh(UserStore users,PerformanceFactsService facts,ConfigurationStore configuration,
                              AlertEvaluator alerts,DashboardAssembler dashboards) {
        this.users=users; this.facts=facts; this.configuration=configuration; this.alerts=alerts; this.dashboards=dashboards;
    }
    public void user(UserAccount user) {
        if (!user.active() || user.role() == UserRole.ADMIN) return;
        boolean advisor=user.role() == UserRole.SALES_ADVISOR;
        var performance=facts.calculate(advisor ? user.id() : user.dealershipId(),
                advisor ? com.championsclub.targets.application.TargetStore.OwnerType.ADVISOR
                        : com.championsclub.targets.application.TargetStore.OwnerType.DEALERSHIP);
        boolean eligible=advisor && configuration.rewardSummary(performance.availablePoints()).affordableRewards()>0;
        alerts.evaluate(user,performance.target(),performance.analytics(),performance.forecast().result(),performance.gamification(),eligible);
        if (advisor) dashboards.advisor(user); else dashboards.manager(user);
    }
    public void dealership(long advisorId,long dealershipId) {
        user(users.get(advisorId));
        int page=0;
        org.springframework.data.domain.Page<UserAccount> managers;
        do {
            managers=users.search("",dealershipId,UserRole.MANAGER,Pages.of(page++,50));
            managers.forEach(this::user);
        } while (managers.hasNext());
    }
}
