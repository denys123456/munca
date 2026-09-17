package com.championsclub.dashboard.infrastructure;
import com.championsclub.dashboard.application.*;
import com.championsclub.ai.application.PerformanceInsight;
import com.championsclub.common.application.CachedGeneration.Generated;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
class AdvisorDetailController {
    private final GetAdvisorDashboardQueryHandler advisors;
    private final GetManagerDashboardQueryHandler managers;
    AdvisorDetailController(GetAdvisorDashboardQueryHandler advisors,GetManagerDashboardQueryHandler managers) {
        this.advisors=advisors; this.managers=managers;
    }
    @GetMapping("/api/advisors/{advisorId}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    AdvisorDashboard advisor(@PathVariable long advisorId) { return advisors.getAdvisorDashboard(new GetAdvisorDashboardQuery(advisorId)); }
    @GetMapping("/api/insights/advisor/{advisorId}")
    Generated<PerformanceInsight> advisorInsight(@PathVariable long advisorId) {
        return advisors.getAdvisorDashboard(new GetAdvisorDashboardQuery(advisorId)).insight();
    }
    @GetMapping("/api/insights/manager/{managerId}/dealership/{dealershipId}")
    Generated<PerformanceInsight> managerInsight(@PathVariable long managerId,@PathVariable long dealershipId) {
        return managers.getManagerDashboard(new GetManagerDashboardQuery(managerId,dealershipId)).insight();
    }
}
