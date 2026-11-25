package com.duelens;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import com.duelens.common.ApiException;
import com.duelens.courses.CourseInput;
import com.duelens.courses.CourseService;
import com.duelens.workspace.WorkspaceService;

@ActiveProfiles("test")
@SpringBootTest
class CourseServiceTests {
    @Autowired private CourseService courses;
    @Autowired private WorkspaceService workspaces;
    @Autowired private JdbcTemplate jdbc;
    private final Set<UUID> users = new HashSet<>();

    @AfterEach
    void cleanup() {
        for (UUID user : users) {
            jdbc.update("DELETE FROM idempotency_requests WHERE user_id = ?", user);
            jdbc.update("DELETE FROM courses WHERE user_id = ?", user);
            jdbc.update("DELETE FROM users WHERE id = ?", user);
        }
    }

    @Test
    void simultaneousRetriesCreateExactlyOneCourseAndStoredResult() throws Exception {
        UUID user = user();
        UUID key = UUID.randomUUID();
        var gate = new CountDownLatch(1);
        var first = CompletableFuture.supplyAsync(() -> { await(gate); return courses.create(user, key, input("과목")); });
        var second = CompletableFuture.supplyAsync(() -> { await(gate); return courses.create(user, key, input("과목")); });
        gate.countDown();
        assertThat(first.get(10, TimeUnit.SECONDS)).isEqualTo(second.get(10, TimeUnit.SECONDS));
        assertThat(count("courses", user)).isOne();
        assertThat(count("idempotency_requests", user)).isOne();
    }

    @Test
    void concurrentDifferentKeysEnforceNormalizedCourseUniqueness() throws Exception {
        UUID user = user();
        var gate = new CountDownLatch(1);
        var first = CompletableFuture.supplyAsync(() -> { await(gate); return createResult(user, " Course "); });
        var second = CompletableFuture.supplyAsync(() -> { await(gate); return createResult(user, "course"); });
        gate.countDown();
        assertThat(List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder("SUCCESS", "COURSE_DUPLICATE");
        assertThat(count("courses", user)).isOne();
        assertThat(count("idempotency_requests", user)).isOne();
    }

    @Test
    void expiredKeysCanBeReusedAndKeysAreScopedToUsers() {
        UUID first = user();
        UUID second = user();
        UUID key = UUID.randomUUID();
        var old = courses.create(first, key, input("이전 과목"));
        var foreign = courses.create(second, key, input("다른 사용자 과목"));
        assertThat(foreign.data().id()).isNotEqualTo(old.data().id());
        jdbc.update("UPDATE idempotency_requests SET created_at = CURRENT_TIMESTAMP - INTERVAL '25 hours', expires_at = CURRENT_TIMESTAMP - INTERVAL '1 hour' WHERE user_id = ? AND request_key = ?", first, key);
        var next = courses.create(first, key, input("새 과목"));
        assertThat(next.data().id()).isNotEqualTo(old.data().id());
        assertThat(count("courses", first)).isEqualTo(2);
        assertThat(count("idempotency_requests", first)).isOne();
    }

    private String createResult(UUID user, String name) {
        try { courses.create(user, UUID.randomUUID(), input(name)); return "SUCCESS"; }
        catch (ApiException error) { return error.code(); }
    }
    private int count(String table, UUID user) { return jdbc.queryForObject("SELECT count(*) FROM " + table + " WHERE user_id = ?", Integer.class, user); }
    private CourseInput input(String name) { return new CourseInput("2026-2", name, "001", List.of(), null); }
    private UUID user() { UUID user = UUID.randomUUID(); users.add(user); workspaces.start(user, null); return user; }
    private static void await(CountDownLatch gate) {
        try { if (!gate.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("Concurrent test timed out"); }
        catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new IllegalStateException(error); }
    }
}
