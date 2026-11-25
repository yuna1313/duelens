package com.duelens.workspace;

import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.duelens.common.ApiException;
import com.duelens.common.ApiResponse;
import com.duelens.security.SessionRateLimiter;
import com.duelens.security.CurrentUser;

@RestController
public class WorkspaceController {
    private static final String RESERVED_USER_ID = WorkspaceController.class.getName() + ".reservedUserId";
    private final WorkspaceService workspaces;
    private final SessionRateLimiter rateLimiter;
    private final SecurityContextRepository contexts;
    private final SessionAuthenticationStrategy authenticationStrategy;

    public WorkspaceController(WorkspaceService workspaces, SessionRateLimiter rateLimiter,
            SecurityContextRepository contexts, SessionAuthenticationStrategy authenticationStrategy) {
        this.workspaces = workspaces;
        this.rateLimiter = rateLimiter;
        this.contexts = contexts;
        this.authenticationStrategy = authenticationStrategy;
    }

    @GetMapping("/api/v1/session")
    public ApiResponse<Session> session(HttpServletRequest request, Authentication authentication, CsrfToken csrf) {
        if (request.getSession(false) == null) rateLimiter.acquire(request.getRemoteAddr());
        var session = request.getSession(true);
        if (session.getAttribute(RESERVED_USER_ID) == null) session.setAttribute(RESERVED_USER_ID, UUID.randomUUID());
        UUID id = CurrentUser.id(authentication);
        if (id != null) workspaces.require(id);
        return ApiResponse.success(new Session(id == null ? "new" : "active", id, csrf.getToken()));
    }

    @PostMapping("/api/v1/workspace/start")
    public ApiResponse<Workspace> start(@Valid @RequestBody WorkspaceStart input, HttpServletRequest request,
            HttpServletResponse response, Authentication authentication) {
        UUID existing = CurrentUser.id(authentication);
        if (existing != null) return ApiResponse.success(workspaces.require(existing));
        var session = request.getSession(false);
        if (session == null || !(session.getAttribute(RESERVED_USER_ID) instanceof UUID reserved)) {
            throw new ApiException("USER_REQUIRED", "사용자 작업 공간을 먼저 시작해 주세요.");
        }
        Workspace workspace = workspaces.start(reserved, input.initialTerm());
        var identity = new PreAuthenticatedAuthenticationToken(workspace.id().toString(), null, AuthorityUtils.createAuthorityList("ROLE_GUEST"));
        authenticationStrategy.onAuthentication(identity, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(identity);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return ApiResponse.success(workspace);
    }

    @GetMapping("/api/v1/workspace")
    public ApiResponse<Workspace> workspace(Authentication authentication) {
        return ApiResponse.success(workspaces.require(CurrentUser.requireId(authentication)));
    }

    @PatchMapping("/api/v1/workspace")
    public ApiResponse<Workspace> selectTerm(@Valid @RequestBody WorkspaceUpdate input, Authentication authentication) {
        return ApiResponse.success(workspaces.selectTerm(CurrentUser.requireId(authentication), input.selectedTerm(), input.expectedRevision()));
    }

    @GetMapping("/api/v1/terms")
    public ApiResponse<WorkspaceService.Terms> terms(Authentication authentication) {
        return ApiResponse.success(workspaces.terms(CurrentUser.requireId(authentication)));
    }

    public record Session(String state, UUID userId, String csrfToken) { }
    public static class WorkspaceStart {
        private String initialTerm;
        @JsonSetter(nulls = Nulls.FAIL)
        public void setInitialTerm(String value) { initialTerm = value; }
        @Pattern(regexp = AcademicTerm.PATTERN)
        public String getInitialTerm() { return initialTerm; }
        public String initialTerm() { return initialTerm; }
    }
    public record WorkspaceUpdate(@NotNull @Pattern(regexp = AcademicTerm.PATTERN) String selectedTerm,
            @NotNull @Min(1) @Max(9007199254740991L) Long expectedRevision) { }
}
