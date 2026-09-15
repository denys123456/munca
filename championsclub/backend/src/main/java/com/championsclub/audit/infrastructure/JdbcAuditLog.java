package com.championsclub.audit.infrastructure;
import com.championsclub.audit.application.AuditLog;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
class JdbcAuditLog implements AuditLog {
    private final JdbcTemplate database;
    JdbcAuditLog(JdbcTemplate database) { this.database = database; }
    public long record(Long actorId, String action, String entityType, long entityId) {
        return database.queryForObject("""
                insert into audit_events(actor_user_id, action, entity_type, entity_id)
                values (?, ?, ?, ?) returning id
                """, Long.class, actorId, action, entityType, entityId);
    }
}
