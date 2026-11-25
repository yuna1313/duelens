package com.duelens.courses;

import java.text.Normalizer;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.duelens.common.RequestParameters;
import com.duelens.workspace.AcademicTerm;

public record CourseInput(String term, String name, String section, List<Integer> days,
        @JsonProperty(value = "startTime", required = true) String startTime) {

    public CourseInput normalized() {
        if (term == null || !term.matches(AcademicTerm.PATTERN)) throw RequestParameters.invalid("소속 학기를 확인해 주세요.");
        String normalizedName = text(name, "과목명", 100);
        String normalizedSection = text(section, "분반", 30);
        if (days == null || days.size() > 7 || days.stream().anyMatch(day -> day == null || day < 1 || day > 7)
                || new HashSet<>(days).size() != days.size()) {
            throw RequestParameters.invalid("수업 요일은 1~7의 정수를 중복 없이 보내 주세요.");
        }
        if (days.isEmpty() ? startTime != null : startTime == null || !startTime.matches("([01][0-9]|2[0-3]):[0-5][0-9]")) {
            throw RequestParameters.invalid("요일이 없으면 시작 시각은 null이며, 요일이 있으면 HH:mm 시각이 필요합니다.");
        }
        return new CourseInput(term, normalizedName, normalizedSection, days.stream().sorted().toList(), startTime);
    }

    int dayMask() { return days.stream().mapToInt(day -> 1 << (day - 1)).reduce(0, (a, b) -> a | b); }
    LocalTime time() { return startTime == null ? null : LocalTime.parse(startTime); }
    String nameKey() { return name.toLowerCase(Locale.ROOT); }
    String sectionKey() { return section.toLowerCase(Locale.ROOT); }

    private static String text(String value, String label, int maximum) {
        if (value == null) throw RequestParameters.invalid(label + "을 입력해 주세요.");
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFC)
                .replaceAll("^[\\s\\p{Z}\\uFEFF]+|[\\s\\p{Z}\\uFEFF]+$", "");
        if (normalized.isEmpty() || normalized.length() > maximum || normalized.indexOf('\0') >= 0) {
            throw RequestParameters.invalid(label + "은 1~" + maximum + "자로 입력해 주세요.");
        }
        for (int index = 0; index < normalized.length(); index++) {
            char ch = normalized.charAt(index);
            if (Character.isHighSurrogate(ch)) {
                if (++index == normalized.length() || !Character.isLowSurrogate(normalized.charAt(index))) {
                    throw RequestParameters.invalid(label + "의 문자 형식을 확인해 주세요.");
                }
            } else if (Character.isLowSurrogate(ch)) {
                throw RequestParameters.invalid(label + "의 문자 형식을 확인해 주세요.");
            }
        }
        return normalized;
    }
}
