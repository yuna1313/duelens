package com.duelens.courses;

import org.springframework.security.core.Authentication;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.duelens.common.ApiResponse;
import com.duelens.common.RequestParameters;
import com.duelens.security.CurrentUser;
import com.duelens.workspace.AcademicTerm;

@RestController
public class CourseController {
    private final CourseService courses;
    public CourseController(CourseService courses) { this.courses = courses; }

    @GetMapping("/api/v1/courses")
    public ApiResponse<CourseService.Page> list(@RequestParam MultiValueMap<String, String> query, Authentication authentication) {
        RequestParameters.allowOnly(query, "term", "page", "size");
        String term = RequestParameters.required(query, "term");
        if (!term.matches(AcademicTerm.PATTERN)) throw RequestParameters.invalid("학기 정보를 확인해 주세요.");
        int page = (int) RequestParameters.number(query.getFirst("page") == null ? "0" : query.getFirst("page"), "page", 0, Integer.MAX_VALUE);
        int size = (int) RequestParameters.number(query.getFirst("size") == null ? "50" : query.getFirst("size"), "size", 1, 100);
        return ApiResponse.success(courses.list(CurrentUser.requireId(authentication), term, page, size));
    }

    @GetMapping("/api/v1/courses/{courseId}")
    public ApiResponse<Course> detail(@PathVariable String courseId, @RequestParam MultiValueMap<String, String> query, Authentication authentication) {
        RequestParameters.allowOnly(query);
        return ApiResponse.success(courses.get(CurrentUser.requireId(authentication), RequestParameters.uuid(courseId)));
    }

    @PostMapping("/api/v1/courses")
    public ApiResponse<Course> create(@RequestBody CourseInput input, @RequestHeader(name = "Idempotency-Key", required = false) String key,
            @RequestParam MultiValueMap<String, String> query, Authentication authentication) {
        RequestParameters.allowOnly(query);
        return courses.create(CurrentUser.requireId(authentication), RequestParameters.uuid(key), input);
    }

    @PutMapping("/api/v1/courses/{courseId}")
    public ApiResponse<Course> update(@PathVariable String courseId, @RequestBody CourseUpdate input,
            @RequestParam MultiValueMap<String, String> query, Authentication authentication) {
        RequestParameters.allowOnly(query);
        return ApiResponse.success(courses.update(CurrentUser.requireId(authentication), RequestParameters.uuid(courseId), input.input(), input.revision()));
    }
}
