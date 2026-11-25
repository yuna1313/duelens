package com.duelens.common;

import org.springframework.boot.health.actuate.endpoint.HealthEndpoint;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    private final HealthEndpoint health;
    public HealthController(HealthEndpoint health) { this.health = health; }

    @GetMapping("/api/health")
    public ApiResponse<?> health() {
        return "UP".equals(health.health().getStatus().getCode())
                ? ApiResponse.success(new HealthStatus("UP"))
                : ApiResponse.failure("SERVER_UNHEALTHY", "서버 연결 상태를 확인해 주세요.");
    }

    private record HealthStatus(String status) { }
}
