package com.duelens;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.json.JsonMapper;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "DUELENS_API_DOCS_ENABLED=true")
class ApiDocumentationHttpTests {
    @Autowired private Environment environment;
    @Autowired private JsonMapper json;

    @Test
    void localUiAndAssetsUseTheReviewedContractAndSafeConfiguration() throws Exception {
        try (var client = HttpClient.newHttpClient()) {
            var html = get(client, "/swagger-ui/index.html");
            assertThat(html.statusCode()).isEqualTo(200);
            assertThat(html.headers().firstValue("Content-Type").orElse("")).contains("text/html");
            assertThat(html.body()).contains("swagger-ui-bundle.js");
            var bundle = get(client, "/swagger-ui/swagger-ui-bundle.js");
            assertThat(bundle.statusCode()).isEqualTo(200);
            assertThat(bundle.body()).contains("SwaggerUIBundle");
            var config = json.readTree(get(client, "/v3/api-docs/swagger-config").body());
            assertThat(config.path("url").asString()).isEqualTo("/api/docs/openapi.json");
            assertThat(config.path("queryConfigEnabled").asBoolean()).isFalse();
            assertThat(config.path("persistAuthorization").asBoolean()).isFalse();
            assertThat(config.path("validatorUrl").asString("")).isEmpty();
            var response = get(client, "/api/docs/openapi.json");
            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.headers().firstValue("Cache-Control").orElse("")).contains("no-store");
            try (var input = new ClassPathResource("api-docs/openapi.json").getInputStream()) {
                assertThat(json.readTree(response.body())).isEqualTo(json.readTree(input));
            }
            assertThat(json.readTree(response.body()).path("info").path("version").asString()).isEqualTo("0.10.0");
        }
    }

    @Test
    void docsDoNotOpenGeneratedSpecsManagementOrProtectedApis() throws Exception {
        try (var client = HttpClient.newHttpClient()) {
            for (String path : List.of("/v3/api-docs", "/v3/api-docs.yaml", "/webjars/swagger-ui/index.html", "/internal-management/health", "/api/v1/courses?term=2026-2")) {
                var response = get(client, path);
                assertThat(response.statusCode()).isEqualTo(200);
                assertThat(json.readTree(response.body()).path("code").asString()).isEqualTo("USER_REQUIRED");
            }
            var write = client.send(HttpRequest.newBuilder(URI.create(base() + "/api/v1/workspace/start"))
                    .header("Origin", base()).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}")).build(), HttpResponse.BodyHandlers.ofString());
            assertThat(json.readTree(write.body()).path("code").asString()).isEqualTo("CSRF_INVALID");
        }
    }

    private String base() { return "http://127.0.0.1:" + environment.getRequiredProperty("local.server.port"); }
    private HttpResponse<String> get(HttpClient client, String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create(base() + path)).GET().build(), HttpResponse.BodyHandlers.ofString());
    }
}
