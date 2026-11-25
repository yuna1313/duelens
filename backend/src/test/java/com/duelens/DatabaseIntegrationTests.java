package com.duelens;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest
class DatabaseIntegrationTests {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private Flyway flyway;

    @Autowired
    private PlatformTransactionManager transactions;

    @Test
    void migrationsAreAppliedOnceAndChecksumsRemainValid() {
        assertThat(flyway.info().applied()).hasSize(2);
        assertThat(flyway.validateWithResult().validationSuccessful).isTrue();
        flyway.migrate();
        assertThat(flyway.info().applied()).hasSize(2);
        assertThat(jdbc.queryForObject("SELECT current_database()", String.class)).isEqualTo("duelens_test");
    }

    @Test
    @Transactional
    void userCourseTaskAndInitialHistoryCanBeSavedTogether() {
        UUID user = addUser();
        UUID course = addCourse(user);
        UUID task = addTask(course);
        jdbc.update("INSERT INTO task_history (id, task_id, version, kind, after_values, occurred_at) "
                + "VALUES (?, ?, 1, 'created', '{}'::jsonb, CURRENT_TIMESTAMP)", UUID.randomUUID(), task);
        assertThat(jdbc.queryForObject("SELECT c.user_id FROM tasks t JOIN courses c ON c.id = t.course_id WHERE t.id = ?",
                UUID.class, task)).isEqualTo(user);
        assertThat(jdbc.queryForObject("SELECT selected_term FROM users WHERE id = ?", String.class, user)).isNull();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM task_history WHERE task_id = ?", Integer.class, task)).isOne();
    }

    @Test
    @Transactional
    void taskWithoutCourseIsRejectedByDatabase() {
        assertThatThrownBy(() -> addTask(null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    void taskWithMissingCourseIsRejectedByForeignKey() {
        assertThatThrownBy(() -> addTask(UUID.randomUUID())).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void historyFailureRollsBackTheTaskInTheSameTransaction() {
        var task = new AtomicReference<UUID>();
        assertThatThrownBy(() -> new TransactionTemplate(transactions).executeWithoutResult(status -> {
            task.set(addTask(addCourse(addUser())));
            jdbc.update("INSERT INTO task_history (id, task_id, version, kind, after_values, occurred_at) "
                    + "VALUES (?, ?, 1, 'created', NULL, CURRENT_TIMESTAMP)", UUID.randomUUID(), task.get());
        })).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(task.get()).isNotNull();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM tasks WHERE id = ?", Integer.class, task.get())).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM task_history WHERE task_id = ?", Integer.class, task.get())).isZero();
    }

    @Test
    @Transactional
    void duplicateActiveCourseIsRejected() {
        UUID user = addUser();
        addCourse(user);
        assertThatThrownBy(() -> addCourse(user)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    void softDeletedCourseKeepsItsTaskAndAllowsNewCourseWithSameName() {
        UUID user = addUser();
        UUID course = addCourse(user);
        UUID task = addTask(course);
        jdbc.update("UPDATE courses SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", course);
        addCourse(user);
        assertThat(jdbc.queryForObject("SELECT course_id FROM tasks WHERE id = ?", UUID.class, task)).isEqualTo(course);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM courses WHERE user_id = ?", Integer.class, user)).isEqualTo(2);
    }

    @Test
    void runtimeRoleCannotChangeHistoryOrMigrationMetadata() {
        for (String privilege : new String[] { "UPDATE", "DELETE" }) {
            assertThat(jdbc.queryForObject("SELECT has_table_privilege(current_user, 'task_history', ?)", Boolean.class, privilege)).isFalse();
        }
        assertThat(jdbc.queryForObject("SELECT has_table_privilege(current_user, 'flyway_schema_history', 'SELECT')", Boolean.class)).isFalse();
        assertThat(jdbc.queryForObject("SELECT has_schema_privilege(current_user, 'public', 'CREATE')", Boolean.class)).isFalse();
        assertThat(jdbc.queryForObject("SELECT rolsuper OR rolcreatedb OR rolcreaterole FROM pg_roles WHERE rolname = current_user", Boolean.class)).isFalse();
    }

    @Test
    @Transactional
    void runtimeRoleCannotExecuteDdl() {
        assertThatThrownBy(() -> jdbc.execute("CREATE TABLE runtime_must_not_create (id integer)"))
                .isInstanceOf(DataAccessException.class);
    }

    private UUID addUser() {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO users (id, created_at, updated_at) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", id);
        return id;
    }

    private UUID addCourse(UUID user) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO courses (id, user_id, term, name, section, name_key, section_key, created_at, updated_at) "
                + "VALUES (?, ?, '2026-2', '검증 과목', '001', '검증 과목', '001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", id, user);
        return id;
    }

    private UUID addTask(UUID course) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO tasks (id, course_id, title, status, created_at, updated_at) "
                + "VALUES (?, ?, '검증 과제', 'todo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", id, course);
        return id;
    }
}
