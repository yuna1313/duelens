package com.duelens.workspace;

public final class AcademicTerm {
    public static final String PATTERN = "^[1-9][0-9]{3}-(1|summer|2|winter)$";
    private AcademicTerm() { }

    public static String label(String code) {
        var parts = code.split("-", 2);
        String semester = switch (parts[1]) {
            case "1" -> "1학기";
            case "2" -> "2학기";
            case "summer" -> "여름 계절학기";
            case "winter" -> "겨울 계절학기";
            default -> throw new IllegalArgumentException("Invalid term");
        };
        return parts[0] + "년 " + semester;
    }

    public static int order(String code) {
        return Integer.parseInt(code.substring(0, 4)) * 10 + switch (code.substring(5)) {
            case "1" -> 1;
            case "summer" -> 2;
            case "2" -> 3;
            case "winter" -> 4;
            default -> throw new IllegalArgumentException("Invalid term");
        };
    }
}
