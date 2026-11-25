package com.duelens;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import com.duelens.common.ApiException;
import com.duelens.workspace.WorkspaceService;

@ActiveProfiles("test")
@SpringBootTest
class WorkspaceServiceTests {
    @Autowired private WorkspaceService workspaces;
    @Autowired private JdbcTemplate jdbc;
    private final Set<UUID> users = new HashSet<>();

    @AfterEach
    void cleanup() { for (UUID id : users) jdbc.update("DELETE FROM users WHERE id = ?", id); }

    @Test
    void concurrentStartsKeepOneUserAndItsOriginalTerm() {
        UUID id = UUID.randomUUID();
        users.add(id);
        var first = CompletableFuture.supplyAsync(() -> workspaces.start(id, null));
        var second = CompletableFuture.supplyAsync(() -> workspaces.start(id, "2026-1"));
        var a = first.join();
        var b = second.join();
        assertThat(a.id()).isEqualTo(b.id());
        assertThat(a.selectedTerm()).isEqualTo(b.selectedTerm());
        assertThat(workspaces.start(id, "2026-winter").selectedTerm()).isEqualTo(a.selectedTerm());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users WHERE id = ?", Integer.class, id)).isOne();
    }

    @Test
    void revisionCheckPrecedesNoOpAndOtherUserIsNotChanged() {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        users.add(first);
        users.add(second);
        workspaces.start(first, null);
        workspaces.start(second, null);
        assertThat(workspaces.selectTerm(first, "2026-2", 1).revision()).isEqualTo(2);
        assertThatThrownBy(() -> workspaces.selectTerm(first, "2026-2", 1)).isInstanceOf(ApiException.class);
        assertThat(workspaces.selectTerm(first, "2026-2", 2).revision()).isEqualTo(2);
        assertThat(workspaces.require(second).selectedTerm()).isNull();
        jdbc.update("UPDATE users SET revision = 9007199254740991 WHERE id = ?", first);
        assertThat(workspaces.selectTerm(first, "2026-2", 9007199254740991L).revision()).isEqualTo(9007199254740991L);
        assertThatThrownBy(() -> workspaces.selectTerm(first, "2026-winter", 9007199254740991L)).isInstanceOf(ApiException.class);
    }
}
