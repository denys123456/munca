package com.championsclub.admin.application;
import java.time.Instant;
import org.springframework.data.domain.*;
public interface SystemQueries {
    Overview overview();
    Page<AuditEvent> audit(Pageable page);
    boolean databaseAvailable();
    record Overview(long activeUsers,long dealerships,long products,long sales,long redemptions,long activePointRules) {}
    record AuditEvent(long id,Long actorUserId,String action,String entityType,long entityId,Instant occurredAt) {}
}
