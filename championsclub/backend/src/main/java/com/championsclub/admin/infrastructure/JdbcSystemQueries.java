package com.championsclub.admin.infrastructure;
import com.championsclub.admin.application.SystemQueries;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
class JdbcSystemQueries implements SystemQueries {
    private final JdbcTemplate database;
    JdbcSystemQueries(JdbcTemplate database) { this.database=database; }
    public Overview overview() {
        return database.queryForObject("""
                select (select count(*) from users where status='ACTIVE'),
                (select count(*) from dealerships),(select count(*) from financial_products),
                (select count(*) from sales),(select count(*) from reward_redemptions),
                (select count(*) from point_rules where active and current_date between active_from and active_until)
                """,(r,n) -> new Overview(r.getLong(1),r.getLong(2),r.getLong(3),r.getLong(4),r.getLong(5),r.getLong(6)));
    }
    public Page<AuditEvent> audit(Pageable page) {
        return new PageImpl<>(database.query("select * from audit_events order by occurred_at desc,id desc limit ? offset ?",
                (r,n) -> new AuditEvent(r.getLong("id"),(Long)r.getObject("actor_user_id"),r.getString("action"),r.getString("entity_type"),
                        r.getLong("entity_id"),r.getTimestamp("occurred_at").toInstant()),page.getPageSize(),page.getOffset()),page,
                database.queryForObject("select count(*) from audit_events",Long.class));
    }
    public boolean databaseAvailable() {
        try { return database.queryForObject("select 1",Integer.class) == 1; }
        catch (org.springframework.dao.DataAccessException exception) { return false; }
    }
}
