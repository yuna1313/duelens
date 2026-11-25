package com.duelens.security;

import java.io.IOException;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import com.duelens.common.ApiResponse;

@Component
public class SecurityResponses {
    private final JsonMapper json;

    public SecurityResponses(JsonMapper json) { this.json = json; }

    public void failure(HttpServletResponse response, String code, String message) throws IOException {
        response.setStatus(200);
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(json.writeValueAsString(ApiResponse.failure(code, message)));
    }
}
