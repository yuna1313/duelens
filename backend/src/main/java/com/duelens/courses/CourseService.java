package com.duelens.courses;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import com.duelens.common.ApiException;
import com.duelens.workspace.WorkspaceService;

@Service
public class CourseService {
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final String OWNED = "SELECT c.* FROM courses c WHERE c.user_id = ? AND c.deleted_at IS NULL";
    private static final RowMapper<Course> ROW = (row, index) -> {
        int mask = row.getInt("meeting_days");
        LocalTime time = row.getObject("start_time", LocalTime.class);
        return new Course(row.getString("term"), row.getString("name"), row.getString("section"),
                IntStream.rangeClosed(1, 7).filter(day -> (mask & (1 << (day - 1))) != 0).boxed().toList(),
                time == null ? null : TIME.format(time), row.getObject("id", UUID.class), row.getLong("revision"),
                row.getTimestamp("created_at").toInstant(), row.getTimestamp("updated_at").toInstant());
    };
    private final JdbcTemplate jdbc;
    private final WorkspaceService workspaces;

    public CourseService(JdbcTemplate jdbc, WorkspaceService workspaces) {
        this.jdbc = jdbc;
        this.workspaces = workspaces;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Page list(UUID user, String term, int page, int size) {
        workspaces.require(user);
        long total = jdbc.queryForObject("SELECT count(*) FROM courses WHERE user_id = ? AND term = ? AND deleted_at IS NULL", Long.class, user, term);
        List<Course> items = jdbc.query(OWNED + " AND c.term = ? ORDER BY c.name COLLATE \"C\", c.section COLLATE \"C\", c.id LIMIT ? OFFSET ?",
                ROW, user, term, size, (long) page * size);
        return new Page(items, page, size, total);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Course get(UUID user, UUID id) {
        workspaces.require(user);
        return owned(user, id, false);
    }

    private Course owned(UUID user, UUID id, boolean lock) {
        return jdbc.query(OWNED + " AND c.id = ?" + (lock ? " FOR UPDATE" : ""), ROW, user, id).stream().findFirst()
                .orElseThrow(() -> new ApiException("NOT_FOUND", "요청한 과목을 찾을 수 없습니다."));
    }

    public record Page(List<Course> items, int page, int size, long total) { }
}
