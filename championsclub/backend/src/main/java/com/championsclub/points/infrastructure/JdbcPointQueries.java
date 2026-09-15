package com.championsclub.points.infrastructure;
import com.championsclub.points.application.PointQueries;
import com.championsclub.points.domain.PointTransactionType;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
class JdbcPointQueries implements PointQueries {
    private final JdbcTemplate database;
    JdbcPointQueries(JdbcTemplate database) { this.database=database; }
    public Page<Transaction> history(long advisorId,Pageable page) {
        return new PageImpl<>(database.query("select * from point_transactions where advisor_id=? order by created_at desc,id desc limit ? offset ?",
                (r,n) -> new Transaction(r.getLong("id"),PointTransactionType.valueOf(r.getString("type")),r.getInt("amount"),
                        r.getLong("source_id"),r.getString("description"),r.getTimestamp("created_at").toInstant()),
                advisorId,page.getPageSize(),page.getOffset()),page,
                database.queryForObject("select count(*) from point_transactions where advisor_id=?",Long.class,advisorId));
    }
}
