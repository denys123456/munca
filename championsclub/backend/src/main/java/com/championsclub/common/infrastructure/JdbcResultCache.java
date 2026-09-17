package com.championsclub.common.infrastructure;
import com.championsclub.common.application.ResultCache;
import java.time.Instant;
import java.sql.Timestamp;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
class JdbcResultCache implements ResultCache {
    private final JdbcTemplate database;
    JdbcResultCache(JdbcTemplate database) { this.database=database; }
    public Optional<Entry> find(String key, String hash, Instant now) {
        return database.query("select result::text, generated_at, expires_at from generated_results where cache_key=? and source_hash=? and expires_at>?",
                (r, n) -> new Entry(r.getString(1), r.getTimestamp(2).toInstant(), r.getTimestamp(3).toInstant()),
                key, hash, Timestamp.from(now)).stream().findFirst();
    }
    public void save(String key, String hash, String json, Instant generatedAt, Instant expiresAt) {
        database.update("""
                insert into generated_results(cache_key, source_hash, result, generated_at, expires_at) values(?, ?, ?::jsonb, ?, ?)
                on conflict(cache_key) do update set source_hash=excluded.source_hash, result=excluded.result,
                generated_at=excluded.generated_at, expires_at=excluded.expires_at
                """, key, hash, json, Timestamp.from(generatedAt), Timestamp.from(expiresAt));
    }
}
