package com.duelens.security;

import java.time.Clock;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.duelens.common.ApiException;

@Component
public class SessionRateLimiter {
    private final int limit;
    private final Clock clock;
    private final Map<String, Window> windows = new HashMap<>();
    private record Window(long expiresAt, int count) { }

    public SessionRateLimiter(@Value("${duelens.security.new-sessions-per-minute:60}") int limit, Clock clock) {
        if (limit < 1) throw new IllegalArgumentException("Invalid session limit");
        this.limit = limit;
        this.clock = clock;
    }

    public synchronized void acquire(String address) {
        long now = clock.millis();
        windows.entrySet().removeIf(entry -> entry.getValue().expiresAt() <= now);
        Window window = windows.get(address);
        if ((window == null && windows.size() >= 4096) || (window != null && window.count() >= limit)) {
            throw new ApiException("RATE_LIMITED", "요청이 많습니다. 잠시 후 다시 시도해 주세요.");
        }
        windows.put(address, new Window(window == null ? now + 60_000 : window.expiresAt(), window == null ? 1 : window.count() + 1));
    }
}
