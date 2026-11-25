package com.duelens.security;

import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.ReadListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

public class WriteOriginFilter extends OncePerRequestFilter {
    private final Set<String> origins;
    private final SecurityResponses responses;

    public WriteOriginFilter(String origins, SecurityResponses responses) {
        this.origins = Arrays.stream(origins.split(",")).map(String::trim).filter(value -> !value.isEmpty()).collect(Collectors.toSet());
        this.responses = responses;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (Set.of("/api/v1/session", "/api/v1/workspace/start", "/api/v1/workspace", "/api/v1/terms").contains(request.getServletPath())
                && request.getQueryString() != null && !request.getQueryString().isEmpty()) {
            responses.failure(response, "MALFORMED_REQUEST", "이 요청은 쿼리 항목을 받지 않습니다.");
            return;
        }
        if (Set.of("POST", "PUT", "PATCH", "DELETE").contains(request.getMethod())) {
            String origin = request.getHeader("Origin");
            String authority = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
            if (origin == null || (!origins.contains(origin) && !authority.equals(origin))) {
                responses.failure(response, "CSRF_INVALID", "요청 인증 정보를 확인해 주세요.");
                return;
            }
            if (request.getContentLengthLong() > 262144) {
                responses.failure(response, "PAYLOAD_TOO_LARGE", "요청 본문은 256 KiB 이내로 보내 주세요.");
                return;
            }
            if (request.getContentType() == null || !request.getContentType().split(";", 2)[0].trim().equalsIgnoreCase("application/json")) {
                responses.failure(response, "MALFORMED_REQUEST", "JSON 형식으로 요청해 주세요.");
                return;
            }
            byte[] body = request.getInputStream().readNBytes(262145);
            if (body.length > 262144) {
                responses.failure(response, "PAYLOAD_TOO_LARGE", "요청 본문은 256 KiB 이내로 보내 주세요.");
                return;
            }
            request = new HttpServletRequestWrapper(request) {
                @Override
                public ServletInputStream getInputStream() {
                    var input = new ByteArrayInputStream(body);
                    return new ServletInputStream() {
                        @Override public int read() { return input.read(); }
                        @Override public int read(byte[] bytes, int offset, int length) { return input.read(bytes, offset, length); }
                        @Override public boolean isFinished() { return input.available() == 0; }
                        @Override public boolean isReady() { return true; }
                        @Override public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException("Synchronous JSON input"); }
                    };
                }
            };
        }
        chain.doFilter(request, response);
    }
}
