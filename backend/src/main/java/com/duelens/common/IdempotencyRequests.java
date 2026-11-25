package com.duelens.common;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
public class IdempotencyRequests {
    private final JdbcTemplate jdbc;
    private final JsonMapper json;

    public IdempotencyRequests(JdbcTemplate jdbc, JsonMapper json) { this.jdbc = jdbc; this.json = json; }

    @Transactional
    public <T> ApiResponse<T> execute(UUID user, UUID key, String operation, Object normalizedRequest,
            Class<T> resultType, Supplier<T> create) {
        String hash = HexFormat.of().formatHex(digest(operation + "\n" + json.writeValueAsString(normalizedRequest)));
        long lock = ByteBuffer.wrap(digest(user + ":" + key)).getLong();
        jdbc.queryForList("SELECT pg_advisory_xact_lock(?)", lock);
        jdbc.update("DELETE FROM idempotency_requests WHERE user_id = ? AND request_key = ? AND expires_at <= statement_timestamp()", user, key);
        var previous = jdbc.query("SELECT operation, request_hash, response_body::text FROM idempotency_requests WHERE user_id = ? AND request_key = ?",
                (row, index) -> new Stored(row.getString(1), row.getString(2), row.getString(3)), user, key);
        if (!previous.isEmpty()) {
            Stored stored = previous.getFirst();
            if (!operation.equals(stored.operation()) || !hash.equals(stored.hash())) {
                throw new ApiException("IDEMPOTENCY_CONFLICT", "이미 사용한 요청 키입니다. 다른 내용의 생성에는 새 키를 사용해 주세요.");
            }
            var body = json.readTree(stored.body());
            return new ApiResponse<>(body.path("success").asBoolean(), body.path("code").asString(), body.path("message").asString(),
                    json.treeToValue(body.path("data"), resultType));
        }
        ApiResponse<T> response = ApiResponse.success(create.get());
        jdbc.update("INSERT INTO idempotency_requests (user_id, request_key, operation, request_hash, response_status, response_body, created_at, expires_at) "
                + "VALUES (?, ?, ?, ?, 200, ?::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours')",
                user, key, operation, hash, json.writeValueAsString(response));
        return response;
    }

    private static byte[] digest(String input) {
        try { return MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8)); }
        catch (NoSuchAlgorithmException error) { throw new IllegalStateException("SHA-256 unavailable", error); }
    }

    private record Stored(String operation, String hash, String body) { }
}
