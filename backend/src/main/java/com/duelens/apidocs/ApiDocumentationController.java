package com.duelens.apidocs;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@ConditionalOnProperty(name = "duelens.api-docs.enabled", havingValue = "true")
public class ApiDocumentationController {
    @GetMapping(value = "/api/docs/openapi.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Resource> specification() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new ClassPathResource("api-docs/openapi.json"));
    }
}
