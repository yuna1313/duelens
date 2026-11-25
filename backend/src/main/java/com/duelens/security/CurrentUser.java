package com.duelens.security;

import java.util.UUID;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import com.duelens.common.ApiException;

public final class CurrentUser {
    private CurrentUser() { }

    public static UUID id(Authentication authentication) {
        return authentication == null || authentication instanceof AnonymousAuthenticationToken || !authentication.isAuthenticated()
                ? null : UUID.fromString(authentication.getName());
    }

    public static UUID requireId(Authentication authentication) {
        UUID id = id(authentication);
        if (id == null) throw new ApiException("USER_REQUIRED", "사용자 작업 공간을 먼저 시작해 주세요.");
        return id;
    }
}
