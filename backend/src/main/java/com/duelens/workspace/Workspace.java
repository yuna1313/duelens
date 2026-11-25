package com.duelens.workspace;

import java.time.Instant;
import java.util.UUID;

public record Workspace(UUID id, String selectedTerm, long revision, Instant createdAt, Instant updatedAt) { }
