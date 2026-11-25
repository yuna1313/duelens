package com.duelens.common;

import java.util.Set;
import java.util.UUID;
import org.springframework.util.MultiValueMap;

public final class RequestParameters {
    public static final long MAX_REVISION = 9007199254740991L;
    private RequestParameters() { }

    public static void allowOnly(MultiValueMap<String, String> query, String... names) {
        Set<String> allowed = Set.of(names);
        if (query.entrySet().stream().anyMatch(entry -> !allowed.contains(entry.getKey()) || entry.getValue().size() != 1)) {
            throw malformed("허용된 쿼리 항목을 각각 한 번만 보내 주세요.");
        }
    }

    public static String required(MultiValueMap<String, String> query, String name) {
        String value = query.getFirst(name);
        if (value == null || value.isEmpty()) throw invalid(name + " 값을 입력해 주세요.");
        return value;
    }

    public static long number(String value, String name, long minimum, long maximum) {
        if (value == null || !value.matches("[0-9]+")) throw malformed(name + " 값은 정수로 보내 주세요.");
        try {
            long number = Long.parseLong(value);
            if (number < minimum || number > maximum) throw invalid(name + " 값의 허용 범위를 확인해 주세요.");
            return number;
        } catch (NumberFormatException error) {
            throw invalid(name + " 값의 허용 범위를 확인해 주세요.");
        }
    }

    public static UUID uuid(String value) {
        if (value == null || !value.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
            throw malformed("ID와 요청 키는 UUID 형식으로 보내 주세요.");
        }
        return UUID.fromString(value);
    }

    public static ApiException invalid(String message) { return new ApiException("VALIDATION_FAILED", message); }
    public static ApiException malformed(String message) { return new ApiException("MALFORMED_REQUEST", message); }
}
