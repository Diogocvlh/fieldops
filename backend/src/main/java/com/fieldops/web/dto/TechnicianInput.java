package com.fieldops.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Locale;

public record TechnicianInput(
        @NotBlank(message = "Informe o nome.") @Size(min = 3, max = 120, message = "O nome deve ter entre 3 e 120 caracteres.") String name,
        @NotBlank(message = "Informe a matrícula.") @Size(max = 64, message = "A matrícula deve ter até 64 caracteres.") String registration,
        @NotBlank(message = "Informe a especialidade.") @Size(max = 120, message = "A especialidade deve ter até 120 caracteres.") String specialty,
        @NotBlank(message = "Informe a região.") @Size(max = 120, message = "A região deve ter até 120 caracteres.") String region,
        @NotNull(message = "Informe a disponibilidade.") Boolean available,
        @NotNull(message = "Informe a capacidade.") @Min(value = 1, message = "A capacidade mínima é 1.") @Max(value = 20, message = "A capacidade máxima é 20.") Integer capacity) {

    public TechnicianInput {
        name = normalize(name);
        registration = registration == null ? null : registration.strip().toUpperCase(Locale.ROOT);
        specialty = normalize(specialty);
        region = normalize(region);
    }

    private static String normalize(String value) { return value == null ? null : value.strip(); }
}
