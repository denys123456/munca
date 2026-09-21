package com.championsclub.dashboard.application;

import com.championsclub.analytics.application.AdvisorAnalyticsRepository;
import com.championsclub.analytics.application.LeaderboardService;
import com.championsclub.dealerships.application.DealershipRepository;
import com.championsclub.security.application.Access;
import com.championsclub.targets.application.TargetStore.OwnerType;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.UserRole;
import org.springframework.stereotype.Service;

@Service
public class AdvisorProfileService {
    private final Access access;
    private final UserStore users;
    private final DealershipRepository dealerships;
    private final PerformanceSnapshotReader snapshots;
    private final AdvisorAnalyticsRepository advisorAnalytics;
    private final LeaderboardService leaderboards;

    public AdvisorProfileService(
            Access access,
            UserStore users,
            DealershipRepository dealerships,
            PerformanceSnapshotReader snapshots,
            AdvisorAnalyticsRepository advisorAnalytics,
            LeaderboardService leaderboards
    ) {
        this.access = access;
        this.users = users;
        this.dealerships = dealerships;
        this.snapshots = snapshots;
        this.advisorAnalytics = advisorAnalytics;
        this.leaderboards = leaderboards;
    }

    public AdvisorProfile get(long advisorId) {
        access.advisor(advisorId);
        var advisor = users.get(advisorId);
        if (advisor.role() != UserRole.ADVISOR) {
            throw new IllegalArgumentException("Advisor profile requires an advisor account.");
        }
        var snapshot = snapshots.read(advisorId, OwnerType.ADVISOR);
        var target = snapshot.target();
        var position = leaderboards.position(
                advisor.id(),
                advisor.dealershipId(),
                advisor.advisorType(),
                target.periodStart(),
                target.periodEnd()
        );
        return new AdvisorProfile(
                advisor,
                DealershipSummary.from(dealerships.get(advisor.dealershipId())),
                snapshot.reportingDate(),
                advisorAnalytics.lifetime(advisorId),
                target,
                snapshot.analytics(),
                position,
                snapshot.availablePoints(),
                snapshot.lifetimeEarnedPoints(),
                snapshot.gamification()
        );
    }
}
