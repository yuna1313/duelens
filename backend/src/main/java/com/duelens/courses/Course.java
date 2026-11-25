package com.duelens.courses;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record Course(String term, String name, String section, List<Integer> days, String startTime,
        UUID id, long revision, Instant createdAt, Instant updatedAt) { }
