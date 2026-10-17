package com.fieldops.web.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignmentInput(@NotNull(message = "Selecione um técnico.") UUID technicianId) {}
