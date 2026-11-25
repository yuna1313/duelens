package com.duelens;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import com.duelens.common.ApiException;
import com.duelens.common.RequestParameters;
import com.duelens.courses.Course;
import com.duelens.courses.CourseInput;
import com.duelens.courses.CourseService;
import com.duelens.workspace.WorkspaceService;
import tools.jackson.databind.json.JsonMapper;

@ActiveProfiles("test")
@SpringBootTest
class CourseHistoryTests {
    @Autowired private CourseService courses;
    @Autowired private WorkspaceService workspaces;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JsonMapper json;
    @Autowired private Flyway flyway;
    private final Set<UUID> committedFixtures = new HashSet<>();

    @AfterEach
    void cleanupCommittedFailureFixturesWithMigrationAccount() {
        if (committedFixtures.isEmpty()) return;
        // The application must retain its lack of UPDATE/DELETE on history.
        var cleanup = new JdbcTemplate(flyway.getConfiguration().getDataSource());
        assertThat(cleanup.queryForObject("SELECT current_database()", String.class)).isEqualTo("duelens_test");
        for (UUID user : committedFixtures) {
            cleanup.update("DELETE FROM task_history WHERE task_id IN (SELECT t.id FROM tasks t JOIN courses c ON c.id = t.course_id WHERE c.user_id = ?)", user);
            cleanup.update("DELETE FROM tasks WHERE course_id IN (SELECT id FROM courses WHERE user_id = ?)", user);
            cleanup.update("DELETE FROM idempotency_requests WHERE user_id = ?", user);
            cleanup.update("DELETE FROM courses WHERE user_id = ?", user);
            cleanup.update("DELETE FROM users WHERE id = ?", user);
        }
    }

    @Test
    @Transactional
    void identityChangesVersionAllLinkedTasksAndKeepPreviousSnapshots() {
        UUID user = user(false);
        Course before = courses.create(user, UUID.randomUUID(), input("기존", "2026-2", "001")).data();
        UUID first = task(before.id(), UUID.randomUUID(), "written");
        UUID second = task(before.id(), UUID.randomUUID(), "submitted");
        Course other = courses.create(user, UUID.randomUUID(), input("별도", "2026-2", "001")).data();
        UUID unrelated = task(other.id(), UUID.randomUUID(), "todo");
        Course updated = courses.update(user, before.id(), input("새 과목", "2026-1", "002"), 1);
        assertThat(updated.revision()).isEqualTo(2);
        for (UUID task : List.of(first, second)) {
            assertThat(revision(task)).isEqualTo(2);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM task_history WHERE task_id = ?", Integer.class, task)).isEqualTo(2);
            var oldSnapshot = json.readTree(jdbc.queryForObject("SELECT before_values::text FROM task_history WHERE task_id = ? AND version = 2", String.class, task));
            var newSnapshot = json.readTree(jdbc.queryForObject("SELECT after_values::text FROM task_history WHERE task_id = ? AND version = 2", String.class, task));
            assertThat(oldSnapshot.path("courseName").asString()).isEqualTo("기존");
            assertThat(oldSnapshot.path("term").asString()).isEqualTo("2026-2");
            assertThat(newSnapshot.path("courseName").asString()).isEqualTo("새 과목");
            assertThat(newSnapshot.path("term").asString()).isEqualTo("2026-1");
            assertThat(newSnapshot.path("section").asString()).isEqualTo("002");
            assertThat(newSnapshot.path("dueDate").isNull()).isTrue();
            assertThat(newSnapshot.path("dueTime").isNull()).isTrue();
            assertThat(newSnapshot.path("courseId").asString()).isEqualTo(before.id().toString());
            assertThat(newSnapshot.size()).isEqualTo(12);
            assertThat(jdbc.queryForObject("SELECT after_values->>'courseName' FROM task_history WHERE task_id = ? AND version = 1", String.class, task)).isEqualTo("기존");
        }
        assertThat(revision(unrelated)).isOne();
        assertThat(jdbc.queryForObject("SELECT status FROM tasks WHERE id = ?", String.class, second)).isEqualTo("submitted");
    }

    @Test
    @Transactional
    void scheduleOnlyChangesAndNoOpDoNotCreateTaskHistory() {
        UUID user = user(false);
        Course before = courses.create(user, UUID.randomUUID(), input("기존", "2026-2", "001")).data();
        UUID task = task(before.id(), UUID.randomUUID(), "todo");
        var schedule = new CourseInput("2026-2", "기존", "001", List.of(2, 4), "10:30");
        Course updated = courses.update(user, before.id(), schedule, 1);
        assertThat(updated.revision()).isEqualTo(2);
        assertThat(courses.update(user, before.id(), schedule, 2)).isEqualTo(updated);
        assertThat(revision(task)).isOne();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM task_history WHERE task_id = ?", Integer.class, task)).isOne();
    }

    @Test
    @Transactional
    void deletionRetainsCourseConnectionTasksAndAppendOnlyHistory() {
        UUID user = user(false);
        Course course = courses.create(user, UUID.randomUUID(), input("기존", "2026-2", "001")).data();
        UUID task = task(course.id(), UUID.randomUUID(), "submitted");
        courses.delete(user, course.id(), 1);
        assertThat(jdbc.queryForObject("SELECT deleted_at IS NOT NULL FROM courses WHERE id = ?", Boolean.class, course.id())).isTrue();
        assertThat(jdbc.queryForObject("SELECT course_id FROM tasks WHERE id = ?", UUID.class, task)).isEqualTo(course.id());
        assertThat(revision(task)).isOne();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM task_history WHERE task_id = ?", Integer.class, task)).isOne();
        assertThat(workspaces.terms(user).items()).extracting(item -> item.code()).contains("2026-2");
    }

    @Test
    void historyConstraintFailureRollsBackCourseAndEveryTaskChange() {
        UUID user = user(true);
        Course before = courses.create(user, UUID.randomUUID(), input("기존", "2026-2", "001")).data();
        UUID first = task(before.id(), UUID.fromString("00000000-0000-4000-8000-" + UUID.randomUUID().toString().substring(24)), "todo");
        UUID second = task(before.id(), UUID.fromString("70000000-0000-4000-8000-" + UUID.randomUUID().toString().substring(24)), "written");
        jdbc.update("INSERT INTO task_history (id, task_id, version, kind, before_values, after_values, occurred_at) VALUES (?, ?, 2, 'manual-edit', '{}'::jsonb, '{}'::jsonb, CURRENT_TIMESTAMP)", UUID.randomUUID(), second);
        assertThatThrownBy(() -> courses.update(user, before.id(), input("실패해야 함", "2026-2", "001"), 1)).isInstanceOf(DataAccessException.class);
        assertThat(courses.get(user, before.id())).isEqualTo(before);
        assertThat(revision(first)).isOne();
        assertThat(revision(second)).isOne();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM task_history WHERE task_id = ?", Integer.class, first)).isOne();
    }

    @Test
    void taskRevisionLimitRollsBackEarlierHistoryInTheBatch() {
        UUID user = user(true);
        Course before = courses.create(user, UUID.randomUUID(), input("기존", "2026-2", "001")).data();
        UUID first = task(before.id(), UUID.fromString("00000000-0000-4000-8000-" + UUID.randomUUID().toString().substring(24)), "todo");
        UUID last = task(before.id(), UUID.fromString("70000000-0000-4000-8000-" + UUID.randomUUID().toString().substring(24)), "todo");
        jdbc.update("UPDATE tasks SET revision = ? WHERE id = ?", RequestParameters.MAX_REVISION, last);
        assertThatThrownBy(() -> courses.update(user, before.id(), input("실패해야 함", "2026-2", "001"), 1))
                .isInstanceOfSatisfying(ApiException.class, error -> assertThat(error.code()).isEqualTo("REVISION_CONFLICT"));
        assertThat(courses.get(user, before.id())).isEqualTo(before);
        assertThat(revision(first)).isOne();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM task_history WHERE task_id = ?", Integer.class, first)).isOne();
    }

    private long revision(UUID task) { return jdbc.queryForObject("SELECT revision FROM tasks WHERE id = ?", Long.class, task); }
    private CourseInput input(String name, String term, String section) { return new CourseInput(term, name, section, List.of(), null); }
    private UUID user(boolean committed) {
        UUID user = UUID.randomUUID();
        if (committed) committedFixtures.add(user);
        workspaces.start(user, null);
        return user;
    }
    private UUID task(UUID course, UUID id, String status) {
        jdbc.update("INSERT INTO tasks (id, course_id, title, status, created_at, updated_at) VALUES (?, ?, '보존할 과제', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", id, course, status);
        jdbc.update("INSERT INTO task_history (id, task_id, version, kind, after_values, occurred_at) VALUES (?, ?, 1, 'created', '{\"courseName\":\"기존\"}'::jsonb, CURRENT_TIMESTAMP)", UUID.randomUUID(), id);
        return id;
    }
}
