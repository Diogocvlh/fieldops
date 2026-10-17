package com.fieldops.web.dto;

import com.fieldops.domain.Priority;
import com.fieldops.domain.WorkOrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record WorkOrderInput(
        @NotBlank(message = "Informe o título da ordem.") @Size(min = 3, max = 120, message = "O título deve ter entre 3 e 120 caracteres.") String title,
        @Size(max = 2000, message = "A descrição deve ter até 2.000 caracteres.") String description,
        UUID technicianId,
        @NotNull(message = "Informe a prioridade.") Priority priority,
        @NotNull(message = "Informe o status.") WorkOrderStatus status,
        @NotNull(message = "Informe o prazo.") LocalDate dueDate) {

    public WorkOrderInput {
        title = title == null ? null : title.strip();
        description = description == null ? "" : description.strip();
    }
}
