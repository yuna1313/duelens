package com.duelens.workspace;

import java.util.Comparator;
import java.util.List;
import java.util.TreeSet;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duelens.common.ApiException;

@Service
public class WorkspaceService {
    private final JdbcTemplate jdbc;
    private static final RowMapper<Workspace> ROW = (row, index) -> new Workspace(row.getObject("id", UUID.class),
            row.getString("selected_term"), row.getLong("revision"), row.getTimestamp("created_at").toInstant(), row.getTimestamp("updated_at").toInstant());
    private static final String ACTIVE_USER = "SELECT id, selected_term, revision, created_at, updated_at FROM users WHERE id = ? AND status IN ('guest', 'active') AND deleted_at IS NULL";

    public WorkspaceService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Workspace require(UUID id) {
        return jdbc.query(ACTIVE_USER, ROW, id).stream().findFirst()
                .orElseThrow(() -> new ApiException("USER_REQUIRED", "사용자 작업 공간을 먼저 시작해 주세요."));
    }

    @Transactional
    public Workspace start(UUID reservedId, String initialTerm) {
        jdbc.update("INSERT INTO users (id, selected_term, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING",
                reservedId, initialTerm);
        return require(reservedId);
    }

    @Transactional
    public Workspace selectTerm(UUID id, String term, long expectedRevision) {
        Workspace current = jdbc.query(ACTIVE_USER + " FOR UPDATE", ROW, id).stream().findFirst()
                .orElseThrow(() -> new ApiException("USER_REQUIRED", "사용자 작업 공간을 먼저 시작해 주세요."));
        if (current.revision() != expectedRevision) {
            throw new ApiException("REVISION_CONFLICT", "다른 변경이 있습니다. 최신 내용을 확인해 주세요.");
        }
        if (term.equals(current.selectedTerm())) return current;
        if (current.revision() == 9007199254740991L) throw new ApiException("REVISION_CONFLICT", "현재 버전의 수정 한도를 확인해 주세요.");
        jdbc.update("UPDATE users SET selected_term = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", term, id);
        return require(id);
    }

    @Transactional(readOnly = true)
    public Terms terms(UUID id) {
        Workspace workspace = require(id);
        var codes = new TreeSet<String>(Comparator.comparingInt(AcademicTerm::order).reversed());
        codes.addAll(jdbc.queryForList("SELECT DISTINCT term FROM courses WHERE user_id = ?", String.class, id));
        if (workspace.selectedTerm() != null) codes.add(workspace.selectedTerm());
        return new Terms(workspace.selectedTerm(), codes.stream().map(code -> new TermItem(code, AcademicTerm.label(code))).toList());
    }

    public record TermItem(String code, String label) { }
    public record Terms(String selectedTerm, List<TermItem> items) { }
}
