package com.championsclub.common.application;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronizationManager;
@Service
public class CachedGeneration {
    private final ResultCache cache;
    private final ObjectMapper json;
    private final Object[] locks = new Object[64];
    public CachedGeneration(ResultCache cache, ObjectMapper json) {
        this.cache=cache; this.json=json;
        Arrays.setAll(locks, index -> new Object());
    }
    public <T> Generated<T> get(String key, Object source, Class<T> type, Duration duration,
                                Supplier<Optional<T>> generate, boolean refresh) {
        if (TransactionSynchronizationManager.isActualTransactionActive())
            throw new IllegalStateException("External generation cannot run inside a database transaction.");
        try {
            String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(source)));
            synchronized (locks[Math.floorMod(key.hashCode(), locks.length)]) {
                Instant now = Instant.now();
                var entry = cache.find(key, hash, now);
                if (entry.isPresent() && !refresh) {
                    var stored = entry.get();
                    T value = stored.json().equals("null") ? null : json.readValue(stored.json(), type);
                    return new Generated<>(value == null ? "UNAVAILABLE" : "AVAILABLE", value, stored.generatedAt(), stored.expiresAt());
                }
                var value = generate.get();
                Instant expiresAt = now.plus(value.isPresent() ? duration : Duration.ofMinutes(2));
                cache.save(key, hash, json.writeValueAsString(value.orElse(null)), now, expiresAt);
                return new Generated<>(value.isPresent() ? "AVAILABLE" : "UNAVAILABLE", value.orElse(null), now, expiresAt);
            }
        } catch (com.fasterxml.jackson.core.JsonProcessingException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Generation serialization failed.", exception);
        }
    }
    public record Generated<T>(String state, T result, Instant generatedAt, Instant expiresAt) {}
}
