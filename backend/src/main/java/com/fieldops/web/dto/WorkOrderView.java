package com.fieldops.web.dto;

import com.fieldops.domain.Priority;
import com.fieldops.domain.WorkOrder;
import com.fieldops.domain.WorkOrderStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record WorkOrderView(UUID id, String code, String title, String description, UUID technicianId,
        Priority priority, WorkOrderStatus status, Instant createdAt, Instant updatedAt,
        LocalDate dueDate, Instant completedAt) {
    public static WorkOrderView from(WorkOrder order) {
        return new WorkOrderView(order.getId(), order.getCode(), order.getTitle(), order.getDescription(),
                order.getTechnicianId(), order.getPriority(), order.getStatus(), order.getCreatedAt(),
                order.getUpdatedAt(), order.getDueDate(), order.getCompletedAt());
    }
}
