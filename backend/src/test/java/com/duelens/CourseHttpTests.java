package com.duelens;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CourseHttpTests {
    @Autowired private Environment environment;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JsonMapper json;
    private final List<Client> clients = new ArrayList<>();
    private final Set<UUID> users = new HashSet<>();
    private final Set<String> sessions = new HashSet<>();

    @AfterEach
    void cleanupOnlyOwnedFixtures() {
        clients.forEach(client -> client.http.close());
        for (String session : sessions) jdbc.update("DELETE FROM spring_session WHERE session_id = ?", session);
        for (UUID user : users) {
            jdbc.update("DELETE FROM spring_session WHERE principal_name = ?", user.toString());
            jdbc.update("DELETE FROM idempotency_requests WHERE user_id = ?", user);
            jdbc.update("DELETE FROM courses WHERE user_id = ?", user);
            jdbc.update("DELETE FROM users WHERE id = ?", user);
        }
    }

    @Test
    void listUsesOwnerTermActiveRowsAndStablePagination() throws Exception {
        Client owner = started();
        Client other = started();
        seed(owner.user, "2026-2", "C", "001", false);
        UUID a = seed(owner.user, "2026-2", "A", "001", false);
        UUID b = seed(owner.user, "2026-2", "B", "001", false);
        seed(owner.user, "2026-1", "A", "001", false);
        seed(owner.user, "2026-2", "D", "001", true);
        seed(other.user, "2026-2", "다른 사용자", "001", false);
        Reply first = owner.get("/api/v1/courses?term=2026-2&size=2");
        code(first, "SUCCESS");
        assertThat(first.body.path("data").path("total").asLong()).isEqualTo(3);
        assertThat(first.body.path("data").path("items").size()).isEqualTo(2);
        assertThat(first.body.path("data").path("items").get(0).path("id").asString()).isEqualTo(a.toString());
        assertThat(first.body.path("data").path("items").get(1).path("id").asString()).isEqualTo(b.toString());
        Reply second = owner.get("/api/v1/courses?term=2026-2&page=1&size=2");
        assertThat(second.body.path("data").path("items").size()).isOne();
        assertThat(second.body.path("data").path("items").get(0).path("name").asString()).isEqualTo("C");
        Reply pastEnd = owner.get("/api/v1/courses?term=2026-2&page=2147483647&size=100");
        code(pastEnd, "SUCCESS");
        assertThat(pastEnd.body.path("data").path("items").isEmpty()).isTrue();
        assertThat(pastEnd.body.path("data").path("total").asLong()).isEqualTo(3);
        assertThat(first.response.headers().firstValue("Cache-Control").orElse("")).contains("no-store");
    }

    @Test
    void detailDoesNotRevealForeignDeletedOrMissingCourses() throws Exception {
        Client owner = started();
        Client other = started();
        UUID id = seed(owner.user, "2026-2", "본인 과목", "001", false);
        UUID deleted = seed(owner.user, "2026-2", "삭제 과목", "001", true);
        Reply found = owner.get("/api/v1/courses/" + id);
        code(found, "SUCCESS");
        assertThat(found.body.path("data").path("days").isEmpty()).isTrue();
        assertThat(found.body.path("data").path("startTime").isNull()).isTrue();
        assertThat(found.body.path("data").size()).isEqualTo(9);
        code(other.get("/api/v1/courses/" + id), "NOT_FOUND");
        code(owner.get("/api/v1/courses/" + deleted), "NOT_FOUND");
        code(owner.get("/api/v1/courses/" + UUID.randomUUID()), "NOT_FOUND");
        code(owner.get("/api/v1/courses/1-1-1-1-1"), "MALFORMED_REQUEST");
    }

    @Test
    void unknownDuplicateAndInvalidQueriesAreRejected() throws Exception {
        Client owner = started();
        for (String suffix : List.of("?term=2026-2&term=2026-1", "?term=2026-2&userId=" + UUID.randomUUID(),
                "?term=2026-2&page=1.5", "?term=2026-2&size=-1")) {
            code(owner.get("/api/v1/courses" + suffix), "MALFORMED_REQUEST");
        }
        for (String suffix : List.of("", "?term=", "?term=2026-3", "?term=2026-2&size=0", "?term=2026-2&size=101",
                "?term=2026-2&page=999999999999999999999")) {
            code(owner.get("/api/v1/courses" + suffix), "VALIDATION_FAILED");
        }
        code(owner.get("/api/v1/courses/" + UUID.randomUUID() + "?term=2026-2"), "MALFORMED_REQUEST");
    }

    @Test
    void anonymousAndWithdrawnUsersCannotReadCourses() throws Exception {
        Client anonymous = client();
        code(anonymous.get("/api/v1/courses?term=2026-2"), "USER_REQUIRED");
        Client owner = started();
        UUID id = seed(owner.user, "2026-2", "본인 과목", "001", false);
        jdbc.update("UPDATE users SET status = 'withdrawn', deleted_at = CURRENT_TIMESTAMP WHERE id = ?", owner.user);
        code(owner.get("/api/v1/courses?term=2026-2"), "USER_REQUIRED");
        code(owner.get("/api/v1/courses/" + id), "USER_REQUIRED");
    }

    private UUID seed(UUID user, String term, String name, String section, boolean deleted) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO courses (id, user_id, term, name, section, name_key, section_key, deleted_at, created_at, updated_at) "
                + "VALUES (?, ?, ?, ?, ?, lower(?), lower(?), ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                id, user, term, name, section, name, section, deleted ? java.sql.Timestamp.from(java.time.Instant.now()) : null);
        return id;
    }

    private Client client() { Client client = new Client(); clients.add(client); return client; }
    private Client started() throws Exception {
        Client client = client();
        client.token();
        Reply reply = client.write("POST", "/api/v1/workspace/start", "{}", null);
        code(reply, "SUCCESS");
        client.user = UUID.fromString(reply.body.path("data").path("id").asString());
        users.add(client.user);
        client.token();
        return client;
    }

    private void code(Reply reply, String expected) {
        assertThat(reply.response.statusCode()).isEqualTo(200);
        assertThat(reply.body.path("code").asString()).isEqualTo(expected);
        assertThat(reply.body.path("success").asBoolean()).isEqualTo("SUCCESS".equals(expected));
        assertThat(reply.body.size()).isEqualTo(4);
        if (!"SUCCESS".equals(expected)) assertThat(reply.body.path("data").isNull()).isTrue();
    }

    private record Reply(HttpResponse<String> response, JsonNode body) { }
    private class Client {
        private final String base = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port");
        private final CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        private final HttpClient http = HttpClient.newBuilder().cookieHandler(cookies).build();
        private UUID user;
        private String csrf;

        private Reply send(HttpRequest.Builder request) throws Exception {
            var response = http.send(request.build(), HttpResponse.BodyHandlers.ofString());
            cookies.getCookieStore().getCookies().stream().filter(cookie -> "DUELENS_SESSION".equals(cookie.getName()))
                    .forEach(cookie -> sessions.add(new String(Base64.getDecoder().decode(cookie.getValue()), StandardCharsets.UTF_8)));
            return new Reply(response, json.readTree(response.body()));
        }
        private Reply get(String path) throws Exception { return send(HttpRequest.newBuilder(URI.create(base + path)).GET()); }
        private Reply write(String method, String path, String body, String key) throws Exception {
            var request = HttpRequest.newBuilder(URI.create(base + path)).header("Origin", base);
            if (body != null) request.header("Content-Type", "application/json");
            if (csrf != null) request.header("X-CSRF-TOKEN", csrf);
            if (key != null) request.header("Idempotency-Key", key);
            return send(request.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body)));
        }
        private void token() throws Exception { csrf = get("/api/v1/session").body.path("data").path("csrfToken").asString(); }
    }
}
