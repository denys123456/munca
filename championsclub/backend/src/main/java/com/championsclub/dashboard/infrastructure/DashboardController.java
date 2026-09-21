package com.championsclub.dashboard.infrastructure;

import com.championsclub.dashboard.application.AdvisorDashboard;
import com.championsclub.dashboard.application.GetAdvisorDashboardQuery;
import com.championsclub.dashboard.application.GetAdvisorDashboardQueryHandler;
import com.championsclub.dashboard.application.GetManagerDashboardQuery;
import com.championsclub.dashboard.application.GetManagerDashboardQueryHandler;
import com.championsclub.dashboard.application.ManagerDashboard;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
class DashboardController {
    private final GetAdvisorDashboardQueryHandler advisorDashboard;
    private final GetManagerDashboardQueryHandler managerDashboard;

    DashboardController(
            GetAdvisorDashboardQueryHandler advisorDashboard,
            GetManagerDashboardQueryHandler managerDashboard
    ) {
        this.advisorDashboard = advisorDashboard;
        this.managerDashboard = managerDashboard;
    }

    @GetMapping("/advisor/{advisorId}")
    @PreAuthorize("hasAnyRole('ADVISOR','MANAGER')")
    AdvisorDashboard getAdvisorDashboard(@PathVariable Long advisorId) {
        return advisorDashboard.getAdvisorDashboard(new GetAdvisorDashboardQuery(advisorId));
    }

    @GetMapping("/manager/{managerId}/dealership/{dealershipId}")
    @PreAuthorize("hasRole('MANAGER')")
    ManagerDashboard getManagerDashboard(@PathVariable Long managerId, @PathVariable Long dealershipId) {
        return managerDashboard.getManagerDashboard(new GetManagerDashboardQuery(managerId, dealershipId));
    }
}
