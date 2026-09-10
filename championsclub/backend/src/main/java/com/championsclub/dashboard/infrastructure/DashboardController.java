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

    private final GetAdvisorDashboardQueryHandler getAdvisorDashboardQueryHandler;
    private final GetManagerDashboardQueryHandler getManagerDashboardQueryHandler;

    DashboardController(
            GetAdvisorDashboardQueryHandler getAdvisorDashboardQueryHandler,
            GetManagerDashboardQueryHandler getManagerDashboardQueryHandler
    ) {
        this.getAdvisorDashboardQueryHandler = getAdvisorDashboardQueryHandler;
        this.getManagerDashboardQueryHandler = getManagerDashboardQueryHandler;
    }

    @GetMapping("/advisor/{advisorId}")
    @PreAuthorize("hasAnyRole('SALES_ADVISOR','MANAGER','ADMIN')")
    AdvisorDashboard getAdvisorDashboard(@PathVariable Long advisorId) {
        return getAdvisorDashboardQueryHandler.getAdvisorDashboard(new GetAdvisorDashboardQuery(advisorId));
    }

    @GetMapping("/manager/{managerId}/dealership/{dealershipId}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ManagerDashboard getManagerDashboard(@PathVariable Long managerId, @PathVariable Long dealershipId) {
        return getManagerDashboardQueryHandler.getManagerDashboard(new GetManagerDashboardQuery(managerId, dealershipId));
    }
}

