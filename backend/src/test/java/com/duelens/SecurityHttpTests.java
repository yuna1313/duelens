package com.duelens;

import static org.assertj.core.api.Assertions.assertThat;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.json.JsonMapper;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SecurityHttpTests {
    @Autowired private Environment environment;
    @Autowired private JsonMapper json;

    @Test
    void publicHealthExposesOnlyStatusAndManagementRouteIsDenied() throws Exception {
        String base = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port");
        try (var client = HttpClient.newHttpClient()) {
            var response = client.send(HttpRequest.newBuilder(URI.create(base + "/api/health")).GET().build(), HttpResponse.BodyHandlers.ofString());
            var body = json.readTree(response.body());
            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(body.path("code").asString()).isEqualTo("SUCCESS");
            assertThat(body.path("data").path("status").asString()).isEqualTo("UP");
            assertThat(body.path("data").size()).isOne();
            var denied = client.send(HttpRequest.newBuilder(URI.create(base + "/internal-management/health")).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(denied.statusCode()).isEqualTo(200);
            assertThat(json.readTree(denied.body()).path("code").asString()).isEqualTo("USER_REQUIRED");
        }
    }

    @Test
    void anonymousWorkspaceAndWriteWithoutCsrfReturnCommonFailures() throws Exception {
        String base = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port");
        try (var client = HttpClient.newHttpClient()) {
            var read = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/workspace")).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(read.statusCode()).isEqualTo(200);
            assertThat(json.readTree(read.body()).path("code").asString()).isEqualTo("USER_REQUIRED");
            var write = client.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/workspace/start"))
                    .header("Origin", base).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{}")).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(write.statusCode()).isEqualTo(200);
            var body = json.readTree(write.body());
            assertThat(body.path("code").asString()).isEqualTo("CSRF_INVALID");
            assertThat(body.path("data").isNull()).isTrue();
            assertThat(body.size()).isEqualTo(4);
        }
    }

    @Test
    void documentationAndWebjarPathsAreClosedByDefault() throws Exception {
        String base = "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port");
        try (var client = HttpClient.newHttpClient()) {
            for (String path : java.util.List.of("/swagger-ui.html", "/swagger-ui/index.html", "/swagger-ui/swagger-ui-bundle.js",
                    "/v3/api-docs/swagger-config", "/api/docs/openapi.json", "/webjars/swagger-ui/index.html")) {
                var response = client.send(HttpRequest.newBuilder(URI.create(base + path)).GET().build(), HttpResponse.BodyHandlers.ofString());
                assertThat(response.statusCode()).isEqualTo(200);
                assertThat(json.readTree(response.body()).path("code").asString()).isEqualTo("USER_REQUIRED");
            }
        }
    }
}
