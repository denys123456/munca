package com.championsclub.dashboard.infrastructure;

import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.common.application.CachedGeneration.Generated;
import com.championsclub.dashboard.application.AdvisorDashboard;
import com.championsclub.dashboard.application.AdvisorProfile;
import com.championsclub.dashboard.application.AdvisorProfileService;
import com.championsclub.dashboard.application.GetAdvisorDashboardQuery;
import com.championsclub.dashboard.application.GetAdvisorDashboardQueryHandler;
import com.championsclub.dashboard.application.GetManagerDashboardQuery;
import com.championsclub.dashboard.application.GetManagerDashboardQueryHandler;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
class AdvisorDetailController {
    private final GetAdvisorDashboardQueryHandler advisors;
    private final GetManagerDashboardQueryHandler managers;
    private final AdvisorProfileService profiles;

    AdvisorDetailController(
            GetAdvisorDashboardQueryHandler advisors,
            GetManagerDashboardQueryHandler managers,
            AdvisorProfileService profiles
    ) {
        this.advisors = advisors;
        this.managers = managers;
        this.profiles = profiles;
    }

    @GetMapping("/api/advisors/{advisorId}")
    @PreAuthorize("hasRole('MANAGER')")
    AdvisorDashboard advisor(@PathVariable long advisorId) {
        return advisors.getAdvisorDashboard(new GetAdvisorDashboardQuery(advisorId));
    }

    @GetMapping("/api/advisors/{advisorId}/profile")
    @PreAuthorize("hasAnyRole('ADVISOR','MANAGER')")
    AdvisorProfile advisorProfile(@PathVariable long advisorId) {
        return profiles.get(advisorId);
    }

    @GetMapping("/api/insights/advisor/{advisorId}")
    @PreAuthorize("hasAnyRole('ADVISOR','MANAGER')")
    Generated<PerformanceInsight> advisorInsight(@PathVariable long advisorId) {
        return advisors.getAdvisorDashboard(new GetAdvisorDashboardQuery(advisorId)).insight();
    }

    @GetMapping("/api/insights/manager/{managerId}/dealership/{dealershipId}")
    @PreAuthorize("hasRole('MANAGER')")
    Generated<PerformanceInsight> managerInsight(@PathVariable long managerId, @PathVariable long dealershipId) {
        return managers.getManagerDashboard(new GetManagerDashboardQuery(managerId, dealershipId)).insight();
    }
}
