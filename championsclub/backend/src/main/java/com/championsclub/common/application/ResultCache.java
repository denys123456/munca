package com.championsclub.common.application;
import java.time.Instant;
import java.util.Optional;
public interface ResultCache {
    Optional<Entry> find(String key, String sourceHash, Instant now);
    void save(String key, String sourceHash, String json, Instant generatedAt, Instant expiresAt);
    record Entry(String json, Instant generatedAt, Instant expiresAt) {}
}
