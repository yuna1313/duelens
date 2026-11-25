package com.duelens;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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
class WorkspaceHttpTests {
    @Autowired private Environment environment;
    @Autowired private JsonMapper json;
    @Autowired private JdbcTemplate jdbc;
    private final List<Client> clients = new ArrayList<>();
    private final Set<UUID> users = new HashSet<>();
    private final Set<String> sessionIds = new HashSet<>();

    @AfterEach
    void cleanupOnlyThisTestsData() {
        for (Client client : clients) client.http.close();
        for (String id : sessionIds) jdbc.update("DELETE FROM spring_session WHERE session_id = ?", id);
        for (UUID id : users) {
            jdbc.update("DELETE FROM spring_session WHERE principal_name = ?", id.toString());
            jdbc.update("DELETE FROM courses WHERE user_id = ?", id);
            jdbc.update("DELETE FROM users WHERE id = ?", id);
        }
    }

    @Test
    void newSessionStartsWithoutTermAndRotatesCookieAndCsrf() throws Exception {
        Client client = client();
        Reply session = client.get("/api/v1/session");
        assertThat(session.body.path("data").path("state").asString()).isEqualTo("new");
        assertThat(session.body.path("data").path("userId").isNull()).isTrue();
        String token = session.body.path("data").path("csrfToken").asString();
        assertThat(token.isBlank()).isFalse();
        String oldCookie = client.cookie();
        String headers = session.response.headers().firstValue("Set-Cookie").orElse("");
        assertThat(headers.contains("HttpOnly") && headers.contains("SameSite=Lax") && headers.contains("Path=/api") && !headers.contains("Domain=")).isTrue();
        assertThat(session.response.headers().firstValue("Cache-Control").orElse("").contains("no-store")).isTrue();
        Reply started = client.write("POST", "/api/v1/workspace/start", "{}", token, client.base);
        assertSuccess(started);
        UUID id = rememberUser(started);
        assertThat(started.body.path("data").path("selectedTerm").isNull()).isTrue();
        assertThat(client.cookie().equals(oldCookie)).isFalse();
        assertThat(client.get("/api/v1/session").body.path("data").path("state").asString()).isEqualTo("active");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM spring_session WHERE principal_name = ?", Integer.class, id.toString())).isPositive();
        Client old = client();
        old.setCookie(oldCookie);
        assertCode(old.get("/api/v1/workspace"), "USER_REQUIRED");
        assertCode(client.write("PATCH", "/api/v1/workspace", "{\"selectedTerm\":\"2026-2\",\"expectedRevision\":1}", token, client.base), "CSRF_INVALID");
    }

    @Test
    void missingAndForgedSessionsCannotReadWorkspace() throws Exception {
        Client client = client();
        assertCode(client.get("/api/v1/workspace"), "USER_REQUIRED");
        client.setCookie(Base64.getEncoder().encodeToString(UUID.randomUUID().toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        assertCode(client.get("/api/v1/workspace"), "USER_REQUIRED");
        client.get("/api/v1/session");
        assertCode(client.get("/api/v1/terms"), "USER_REQUIRED");
    }

    @Test
    void csrfAndOriginAreRequiredAndAnotherSessionsTokenIsRejected() throws Exception {
        Client owner = client();
        String token = owner.token();
        assertCode(owner.write("POST", "/api/v1/workspace/start", "{}", null, owner.base), "CSRF_INVALID");
        assertCode(owner.write("POST", "/api/v1/workspace/start", "{}", "invalid", owner.base), "CSRF_INVALID");
        assertCode(owner.write("POST", "/api/v1/workspace/start", "{}", token, "https://untrusted.example"), "CSRF_INVALID");
        assertCode(owner.write("POST", "/api/v1/workspace/start", "{}", token, null), "CSRF_INVALID");
        assertCode(owner.write("POST", "/api/v1/workspace/start", "{}", client().token(), owner.base), "CSRF_INVALID");
        assertSuccess(owner.start("{}"));
    }

    @Test
    void startIsIdempotentAndSelectingTermChecksRevisionBeforeNoOp() throws Exception {
        Client client = client();
        Reply first = client.start("{}");
        UUID id = rememberUser(first);
        Reply second = client.start("{\"initialTerm\":\"2025-1\"}");
        assertSuccess(second);
        assertThat(second.body.path("data").path("id").asString()).isEqualTo(id.toString());
        assertThat(second.body.path("data").path("selectedTerm").isNull()).isTrue();
        String input = "{\"selectedTerm\":\"2026-winter\",\"expectedRevision\":1}";
        Reply updated = client.write("PATCH", "/api/v1/workspace", input, client.token(), client.base);
        assertSuccess(updated);
        assertThat(updated.body.path("data").path("revision").asLong()).isEqualTo(2);
        assertCode(client.write("PATCH", "/api/v1/workspace", input, client.token(), client.base), "REVISION_CONFLICT");
        assertSuccess(client.write("PATCH", "/api/v1/workspace", input.replace(":1", ":2"), client.token(), client.base));
        assertThat(client.get("/api/v1/workspace").body.path("data").path("revision").asLong()).isEqualTo(2);
    }

    @Test
    void workspaceAndTermsUseSessionOwnerAndIgnoreForeignIdentityHeader() throws Exception {
        Client first = client();
        Client second = client();
        UUID firstId = rememberUser(first.start("{}"));
        UUID secondId = rememberUser(second.start("{}"));
        addCourse(firstId, "2025-summer");
        addCourse(secondId, "2024-2");
        Reply owned = first.send(HttpRequest.newBuilder(URI.create(first.base + "/api/v1/workspace")).header("X-User-ID", secondId.toString()).GET().build());
        assertThat(owned.body.path("data").path("id").asString()).isEqualTo(firstId.toString());
        JsonNode terms = first.get("/api/v1/terms").body.path("data").path("items");
        assertThat(terms.size()).isOne();
        assertThat(terms.get(0).path("code").asString()).isEqualTo("2025-summer");
        assertThat(second.get("/api/v1/terms").body.path("data").path("items").get(0).path("code").asString()).isEqualTo("2024-2");
        assertCode(first.write("PATCH", "/api/v1/workspace", "{\"userId\":\"" + secondId + "\",\"selectedTerm\":\"2026-2\",\"expectedRevision\":1}", first.token(), first.base), "MALFORMED_REQUEST");
        assertCode(first.get("/api/v1/workspace?userId=" + secondId), "MALFORMED_REQUEST");
        assertThat(second.get("/api/v1/workspace").body.path("data").path("selectedTerm").isNull()).isTrue();
    }

    @Test
    void malformedNullAndOversizedRequestsDoNotCreateUsers() throws Exception {
        Client client = client();
        String token = client.token();
        for (String input : List.of("{\"initialTerm\":null}", "{\"initialTerm\":2026}", "{\"userId\":\"invented\"}", "{\"initialTerm\":\"2026-1\",\"initialTerm\":\"2026-2\"}", "{} {}", "{broken")) {
            assertCode(client.write("POST", "/api/v1/workspace/start", input, token, client.base), "MALFORMED_REQUEST");
        }
        assertCode(client.write("POST", "/api/v1/workspace/start", "{\"initialTerm\":\"2026-3\"}", token, client.base), "VALIDATION_FAILED");
        assertCode(client.write("POST", "/api/v1/workspace/start", " ".repeat(262145), token, client.base), "PAYLOAD_TOO_LARGE");
        assertThat(client.get("/api/v1/session").body.path("data").path("state").asString()).isEqualTo("new");
    }

    @Test
    void revisionRequiresAnIntegerWithoutScalarCoercion() throws Exception {
        Client client = client();
        client.start("{}");
        for (String revision : List.of("\"1\"", "1.5", "true")) {
            assertCode(client.write("PATCH", "/api/v1/workspace", "{\"selectedTerm\":\"2026-2\",\"expectedRevision\":" + revision + "}", client.token(), client.base), "MALFORMED_REQUEST");
        }
        assertThat(client.get("/api/v1/workspace").body.path("data").path("revision").asLong()).isOne();
    }

    @Test
    void expiredSessionCannotRecoverItsOldUserAutomatically() throws Exception {
        Client client = client();
        UUID first = rememberUser(client.start("{}"));
        jdbc.update("UPDATE spring_session SET last_access_time = 0, expiry_time = 0 WHERE principal_name = ?", first.toString());
        assertCode(client.get("/api/v1/workspace"), "USER_REQUIRED");
        assertThat(client.get("/api/v1/session").body.path("data").path("userId").isNull()).isTrue();
        UUID next = rememberUser(client.start("{}"));
        assertThat(next.equals(first)).isFalse();
    }

    @Test
    void withdrawnUserCannotReadOrChangeWorkspace() throws Exception {
        Client client = client();
        UUID id = rememberUser(client.start("{}"));
        String token = client.token();
        jdbc.update("UPDATE users SET status = 'withdrawn', deleted_at = CURRENT_TIMESTAMP WHERE id = ?", id);
        assertCode(client.get("/api/v1/workspace"), "USER_REQUIRED");
        assertCode(client.write("PATCH", "/api/v1/workspace", "{\"selectedTerm\":\"2026-2\",\"expectedRevision\":1}", token, client.base), "USER_REQUIRED");
    }

    private UUID rememberUser(Reply reply) {
        assertSuccess(reply);
        UUID id = UUID.fromString(reply.body.path("data").path("id").asString());
        users.add(id);
        return id;
    }

    private void assertSuccess(Reply reply) { assertCode(reply, "SUCCESS"); }
    private void assertCode(Reply reply, String code) {
        assertThat(reply.response.statusCode()).isEqualTo(200);
        assertThat(reply.body.path("code").asString()).isEqualTo(code);
        assertThat(reply.body.size()).isEqualTo(4);
        assertThat(reply.body.path("success").asBoolean()).isEqualTo("SUCCESS".equals(code));
        if (!"SUCCESS".equals(code)) assertThat(reply.body.path("data").isNull()).isTrue();
    }

    private void addCourse(UUID user, String term) {
        jdbc.update("INSERT INTO courses (id, user_id, term, name, section, name_key, section_key, created_at, updated_at) "
                + "VALUES (?, ?, ?, '소유권 확인', '001', '소유권 확인', '001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", UUID.randomUUID(), user, term);
    }

    private Client client() { Client client = new Client(); clients.add(client); return client; }
    private record Reply(HttpResponse<String> response, JsonNode body) { }

    private class Client {
        private final String base = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port");
        private final CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        private final HttpClient http = HttpClient.newBuilder().cookieHandler(cookies).build();

        private Reply send(HttpRequest request) throws Exception {
            var response = http.send(request, HttpResponse.BodyHandlers.ofString());
            for (HttpCookie cookie : cookies.getCookieStore().getCookies()) {
                if (cookie.getName().equals("DUELENS_SESSION")) {
                    try { sessionIds.add(new String(Base64.getDecoder().decode(cookie.getValue()), java.nio.charset.StandardCharsets.UTF_8)); }
                    catch (IllegalArgumentException ignored) { /* forged cookie in a failure test */ }
                }
            }
            return new Reply(response, json.readTree(response.body()));
        }
        private Reply get(String path) throws Exception { return send(HttpRequest.newBuilder(URI.create(base + path)).GET().build()); }
        private Reply write(String method, String path, String body, String token, String origin) throws Exception {
            var request = HttpRequest.newBuilder(URI.create(base + path)).header("Content-Type", "application/json");
            if (origin != null) request.header("Origin", origin);
            if (token != null) request.header("X-CSRF-TOKEN", token);
            return send(request.method(method, HttpRequest.BodyPublishers.ofString(body)).build());
        }
        private String token() throws Exception { return get("/api/v1/session").body.path("data").path("csrfToken").asString(); }
        private Reply start(String body) throws Exception {
            Reply reply = write("POST", "/api/v1/workspace/start", body, token(), base);
            if (reply.body.path("success").asBoolean()) rememberUser(reply);
            return reply;
        }
        private String cookie() { return cookies.getCookieStore().getCookies().stream().filter(cookie -> cookie.getName().equals("DUELENS_SESSION")).findFirst().orElseThrow().getValue(); }
        private void setCookie(String value) {
            cookies.getCookieStore().removeAll();
            var cookie = new HttpCookie("DUELENS_SESSION", value);
            cookie.setPath("/api");
            cookie.setVersion(0);
            cookies.getCookieStore().add(URI.create(base), cookie);
        }
    }
}
