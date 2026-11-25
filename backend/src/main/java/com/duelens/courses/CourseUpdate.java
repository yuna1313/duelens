package com.duelens.courses;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.duelens.common.RequestParameters;

public record CourseUpdate(String term, String name, String section, List<Integer> days,
        @JsonProperty(value = "startTime", required = true) String startTime, Long expectedRevision) {
    public CourseInput input() { return new CourseInput(term, name, section, days, startTime); }
    public long revision() {
        if (expectedRevision == null || expectedRevision < 1 || expectedRevision > RequestParameters.MAX_REVISION) {
            throw RequestParameters.invalid("수정 전 조회한 요청 버전을 보내 주세요.");
        }
        return expectedRevision;
    }
}
