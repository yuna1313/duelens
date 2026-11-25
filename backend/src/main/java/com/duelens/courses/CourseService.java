package com.duelens.courses;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import com.duelens.common.ApiException;
import com.duelens.common.ApiResponse;
import com.duelens.common.IdempotencyRequests;
import com.duelens.common.RequestParameters;
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
    private final IdempotencyRequests requests;
    private final CourseTaskHistory history;

    public CourseService(JdbcTemplate jdbc, WorkspaceService workspaces, IdempotencyRequests requests, CourseTaskHistory history) {
        this.jdbc = jdbc;
        this.workspaces = workspaces;
        this.requests = requests;
        this.history = history;
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

    @Transactional
    public ApiResponse<Course> create(UUID user, UUID key, CourseInput input) {
        CourseInput value = input.normalized();
        lockOwner(user);
        return requests.execute(user, key, "POST /api/v1/courses", value, Course.class, () -> {
            UUID id = UUID.randomUUID();
            try {
                jdbc.update("INSERT INTO courses (id, user_id, term, name, section, name_key, section_key, meeting_days, start_time, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                        id, user, value.term(), value.name(), value.section(), value.nameKey(), value.sectionKey(), value.dayMask(), value.time());
            } catch (DuplicateKeyException error) {
                throw new ApiException("COURSE_DUPLICATE", "같은 학기·이름·분반의 과목이 이미 있습니다.");
            }
            return owned(user, id, false);
        });
    }

    @Transactional
    public Course update(UUID user, UUID id, CourseInput input, long expectedRevision) {
        CourseInput value = input.normalized();
        lockOwner(user);
        Course current = owned(user, id, true);
        checkRevision(current, expectedRevision);
        boolean identityChanged = !current.term().equals(value.term()) || !current.name().equals(value.name()) || !current.section().equals(value.section());
        if (!identityChanged && current.days().equals(value.days()) && java.util.Objects.equals(current.startTime(), value.startTime())) return current;
        requireNextRevision(current.revision());
        try {
            jdbc.update("UPDATE courses SET term = ?, name = ?, section = ?, name_key = ?, section_key = ?, meeting_days = ?, start_time = ?, "
                    + "revision = revision + 1, updated_at = statement_timestamp() WHERE id = ? AND user_id = ?",
                    value.term(), value.name(), value.section(), value.nameKey(), value.sectionKey(), value.dayMask(), value.time(), id, user);
        } catch (DuplicateKeyException error) {
            throw new ApiException("COURSE_DUPLICATE", "같은 학기·이름·분반의 과목이 이미 있습니다.");
        }
        Course updated = owned(user, id, false);
        if (identityChanged) history.record(current, updated);
        return updated;
    }

    private void checkRevision(Course current, long expectedRevision) {
        if (current.revision() != expectedRevision) throw new ApiException("REVISION_CONFLICT", "다른 변경이 있습니다. 최신 내용을 확인해 주세요.");
    }

    private void requireNextRevision(long revision) {
        if (revision == RequestParameters.MAX_REVISION) throw new ApiException("REVISION_CONFLICT", "현재 버전의 수정 한도를 확인해 주세요.");
    }

    private void lockOwner(UUID user) {
        if (jdbc.queryForList("SELECT id FROM users WHERE id = ? AND status IN ('guest', 'active') AND deleted_at IS NULL FOR SHARE", UUID.class, user).isEmpty()) {
            throw new ApiException("USER_REQUIRED", "사용자 작업 공간을 먼저 시작해 주세요.");
        }
    }

    private Course owned(UUID user, UUID id, boolean lock) {
        return jdbc.query(OWNED + " AND c.id = ?" + (lock ? " FOR UPDATE" : ""), ROW, user, id).stream().findFirst()
                .orElseThrow(() -> new ApiException("NOT_FOUND", "요청한 과목을 찾을 수 없습니다."));
    }

    public record Page(List<Course> items, int page, int size, long total) { }
}
