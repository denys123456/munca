package com.championsclub.alerts.application;

import com.championsclub.common.application.Pages;
import com.championsclub.dashboard.application.DashboardAssembler;
import com.championsclub.dashboard.application.PerformanceFactsService;
import com.championsclub.rewards.application.RewardRepository;
import com.championsclub.targets.application.TargetStore.OwnerType;
import com.championsclub.users.application.UserAccount;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import org.springframework.stereotype.Service;

@Service
public class PerformanceRefresh {
    private final UserStore users;
    private final PerformanceFactsService facts;
    private final RewardRepository rewards;
    private final AlertEvaluator alerts;
    private final DashboardAssembler dashboards;

    public PerformanceRefresh(
            UserStore users,
            PerformanceFactsService facts,
            RewardRepository rewards,
            AlertEvaluator alerts,
            DashboardAssembler dashboards
    ) {
        this.users = users;
        this.facts = facts;
        this.rewards = rewards;
        this.alerts = alerts;
        this.dashboards = dashboards;
    }

    public void user(UserAccount user) {
        if (!user.active()) {
            return;
        }
        boolean advisor = user.role() == UserRole.ADVISOR;
        var performance = facts.calculate(
                advisor ? user.id() : user.dealershipId(),
                advisor ? OwnerType.ADVISOR : OwnerType.DEALERSHIP
        );
        boolean rewardEligible = advisor && rewards.summary(performance.availablePoints()).affordableRewards() > 0;
        alerts.evaluate(
                user,
                performance.target(),
                performance.analytics(),
                performance.forecast().result(),
                performance.gamification(),
                rewardEligible,
                performance.reportingDate()
        );
        if (advisor) {
            dashboards.advisor(user);
        } else {
            dashboards.manager(user);
        }
    }

    public void dealership(long advisorId, long dealershipId) {
        user(users.get(advisorId));
        int page = 0;
        org.springframework.data.domain.Page<UserAccount> managers;
        do {
            managers = users.search("", dealershipId, UserRole.MANAGER, Pages.of(page++, 50));
            managers.forEach(this::user);
        } while (managers.hasNext());
    }
}
