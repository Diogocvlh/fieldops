package com.fieldops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "activities")
public class Activity {
    @Id
    private UUID id;
    @Column(nullable = false, length = 500)
    private String message;
    @Column(nullable = false)
    private Instant createdAt;
    private UUID workOrderId;

    protected Activity() {}

    public Activity(String message, Instant createdAt, UUID workOrderId) {
        this.id = UUID.randomUUID();
        this.message = message;
        this.createdAt = createdAt;
        this.workOrderId = workOrderId;
    }

    public UUID getId() { return id; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
    public UUID getWorkOrderId() { return workOrderId; }
}
