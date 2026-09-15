package com.championsclub.admin.infrastructure;
import com.championsclub.admin.application.*;
import com.championsclub.common.application.Pages;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@PreAuthorize("hasRole('ADMIN')")
class SystemController {
    private final SystemQueries queries;
    private final SystemHealth health;
    SystemController(SystemQueries queries,SystemHealth health) { this.queries=queries; this.health=health; }
    @GetMapping("/api/dashboard/admin")
    AdminDashboard overview() { return new AdminDashboard(queries.overview(),health.status(),queries.audit(Pages.of(0,10)).getContent()); }
    @GetMapping("/api/admin/health")
    SystemHealth.Health health() { return health.status(); }
    @GetMapping("/api/audit")
    Page<SystemQueries.AuditEvent> audit(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return queries.audit(Pages.of(page,size));
    }
    record AdminDashboard(SystemQueries.Overview activity,SystemHealth.Health health,java.util.List<SystemQueries.AuditEvent> recentAudit) {}
}
