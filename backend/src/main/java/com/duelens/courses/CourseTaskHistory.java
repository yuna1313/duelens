package com.duelens.courses;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import com.duelens.common.ApiException;
import com.duelens.common.RequestParameters;
import com.duelens.history.TaskSnapshot;
import tools.jackson.databind.json.JsonMapper;

@Component
public class CourseTaskHistory {
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");
    private final JdbcTemplate jdbc;
    private final JsonMapper json;
    public CourseTaskHistory(JdbcTemplate jdbc, JsonMapper json) { this.jdbc = jdbc; this.json = json; }

    public void record(Course before, Course after) {
        var tasks = jdbc.query("SELECT * FROM tasks WHERE course_id = ? ORDER BY id FOR UPDATE", (row, index) -> {
            LocalTime time = row.getObject("due_time", LocalTime.class);
            return new TaskRow(row.getObject("id", UUID.class), row.getLong("revision"),
                    new TaskSnapshot(before.term(), before.id(), before.name(), before.section(), row.getString("title"),
                            row.getObject("due_date", LocalDate.class), time == null ? null : TIME.format(time), row.getString("status"),
                            row.getString("submission_format"), row.getString("quantity"), row.getString("submission_url"), row.getString("description")));
        }, before.id());
        for (TaskRow task : tasks) {
            if (task.revision() == RequestParameters.MAX_REVISION) {
                throw new ApiException("REVISION_CONFLICT", "연결 과제의 수정 한도를 확인해 주세요.");
            }
            jdbc.update("UPDATE tasks SET revision = revision + 1, updated_at = ? WHERE id = ?", Timestamp.from(after.updatedAt()), task.id());
            jdbc.update("INSERT INTO task_history (id, task_id, version, snapshot_version, kind, before_values, after_values, note, occurred_at) "
                    + "VALUES (?, ?, ?, 1, 'manual-edit', ?::jsonb, ?::jsonb, '과목 정보를 변경했습니다.', ?)",
                    UUID.randomUUID(), task.id(), task.revision() + 1, json.writeValueAsString(task.before()),
                    json.writeValueAsString(task.before().withCourse(after)), Timestamp.from(after.updatedAt()));
        }
    }

    private record TaskRow(UUID id, long revision, TaskSnapshot before) { }
}
