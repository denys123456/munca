package com.championsclub.targets.infrastructure;
import com.championsclub.targets.application.TargetStore;
import com.championsclub.common.application.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.*;
import org.springframework.stereotype.Repository;
@Repository
class JdbcTargetStore implements TargetStore {
    private final JdbcTemplate database;
    private final RowMapper<TargetData> mapper = (r, n) -> new TargetData(r.getLong("id"), OwnerType.valueOf(r.getString("owner_type")),
            r.getLong("owner_id"), r.getDate("start_date").toLocalDate(), r.getDate("end_date").toLocalDate(),
            r.getBigDecimal("target_amount"), r.getString("currency"), "ACTIVE".equals(r.getString("status")));
    JdbcTargetStore(JdbcTemplate database) { this.database=database; }
    public TargetData get(long id) {
        return database.query("select * from targets where id=?", mapper, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("TARGET_NOT_FOUND", "Target not found."));
    }
    public TargetData save(Long id, TargetData d, long actorId) {
        if (id == null) id=database.queryForObject("""
                insert into targets(owner_id, owner_type, start_date, end_date, target_amount, currency, status, created_by)
                values(?, ?, ?, ?, ?, ?, ?, ?) returning id
                """, Long.class, d.ownerId(), d.ownerType().name(), d.periodStart(), d.periodEnd(), d.targetAmount(),
                d.currency(), d.active() ? "ACTIVE" : "INACTIVE", actorId);
        else database.update("""
                update targets set owner_id=?, owner_type=?, start_date=?, end_date=?, target_amount=?, currency=?, status=?, updated_at=now() where id=?
                """, d.ownerId(), d.ownerType().name(), d.periodStart(), d.periodEnd(), d.targetAmount(), d.currency(),
                d.active() ? "ACTIVE" : "INACTIVE", id);
        return get(id);
    }
    public Optional<TargetData> current(long ownerId, OwnerType type, LocalDate date) {
        return database.query("select * from targets where owner_id=? and owner_type=? and status='ACTIVE' and ? between start_date and end_date",
                mapper, ownerId, type.name(), date).stream().findFirst();
    }
    public Page<TargetData> list(long ownerId, OwnerType type, Pageable page) {
        return new PageImpl<>(database.query("select * from targets where owner_id=? and owner_type=? order by id desc limit ? offset ?",
                mapper, ownerId, type.name(), page.getPageSize(), page.getOffset()), page,
                database.queryForObject("select count(*) from targets where owner_id=? and owner_type=?", Long.class, ownerId, type.name()));
    }
}
