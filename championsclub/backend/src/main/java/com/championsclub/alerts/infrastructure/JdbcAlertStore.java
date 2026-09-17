package com.championsclub.alerts.infrastructure;
import com.championsclub.alerts.application.AlertStore;
import com.championsclub.alerts.domain.*;
import com.championsclub.common.application.ResourceNotFoundException;
import java.sql.Timestamp;
import java.time.Instant;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.*;
import org.springframework.stereotype.Repository;
@Repository
class JdbcAlertStore implements AlertStore {
    private final JdbcTemplate database;
    private final RowMapper<AlertData> mapper=(r,n) -> new AlertData(r.getLong("id"),r.getLong("recipient_id"),r.getLong("dealership_id"),
            AlertType.valueOf(r.getString("type")),AlertSeverity.valueOf(r.getString("severity")),r.getString("title"),r.getString("message"),
            r.getString("related_entity_type"),(Long)r.getObject("related_entity_id"),time(r.getTimestamp("created_at")),
            time(r.getTimestamp("read_at")),time(r.getTimestamp("resolved_at")));
    JdbcAlertStore(JdbcTemplate database) { this.database=database; }
    private static Instant time(Timestamp value) { return value == null ? null : value.toInstant(); }
    public Page<AlertData> list(long recipientId, Pageable page) {
        return new PageImpl<>(database.query("select * from alerts where recipient_id=? order by created_at desc, id desc limit ? offset ?",
                mapper,recipientId,page.getPageSize(),page.getOffset()),page,
                database.queryForObject("select count(*) from alerts where recipient_id=?",Long.class,recipientId));
    }
    public AlertData get(long id) {
        return database.query("select * from alerts where id=?",mapper,id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("ALERT_NOT_FOUND","Alert not found."));
    }
    public AlertData read(long id) {
        database.update("update alerts set is_read=true, read_at=coalesce(read_at,now()) where id=?",id);
        return get(id);
    }
    public AlertData resolve(long id) {
        database.update("update alerts set resolved_at=coalesce(resolved_at,now()) where id=?",id);
        return get(id);
    }
    public void create(NewAlert a) {
        database.update("""
                insert into alerts(recipient_id,dealership_id,type,severity,title,message,is_read,created_at,
                related_entity_type,related_entity_id,deduplication_key) values(?,?,?,?,?,?,false,now(),?,?,?)
                on conflict(deduplication_key) do nothing
                """,a.recipientId(),a.dealershipId(),a.type().name(),a.severity().name(),a.title(),a.message(),
                a.relatedEntityType(),a.relatedEntityId(),a.deduplicationKey());
    }
}
