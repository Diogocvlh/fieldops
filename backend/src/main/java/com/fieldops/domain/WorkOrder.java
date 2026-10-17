package com.fieldops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "work_orders")
public class WorkOrder {
    @Id
    private UUID id;
    @Column(nullable = false, unique = true, updatable = false, length = 32)
    private String code;
    @Column(nullable = false, length = 120)
    private String title;
    @Column(nullable = false, length = 2000)
    private String description;
    private UUID technicianId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Priority priority;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private WorkOrderStatus status;
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Column(nullable = false)
    private LocalDate dueDate;
    private Instant completedAt;

    protected WorkOrder() {}

    public WorkOrder(UUID id, String code, String title, String description, UUID technicianId,
            Priority priority, WorkOrderStatus status, LocalDate dueDate, Instant now) {
        this.id = id;
        this.code = code;
        this.createdAt = now;
        update(title, description, technicianId, priority, status, dueDate, now);
    }

    public void update(String title, String description, UUID technicianId, Priority priority,
            WorkOrderStatus status, LocalDate dueDate, Instant now) {
        this.title = title;
        this.description = description;
        this.technicianId = technicianId;
        this.priority = priority;
        if (status == WorkOrderStatus.COMPLETED) {
            if (this.status != WorkOrderStatus.COMPLETED) completedAt = now;
        } else {
            completedAt = null;
        }
        this.status = status;
        this.dueDate = dueDate;
        updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public UUID getTechnicianId() { return technicianId; }
    public Priority getPriority() { return priority; }
    public WorkOrderStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public LocalDate getDueDate() { return dueDate; }
    public Instant getCompletedAt() { return completedAt; }
}
