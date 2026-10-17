package com.fieldops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "technicians")
public class Technician {
    @Id
    private UUID id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, unique = true, length = 64)
    private String registration;
    @Column(nullable = false, length = 120)
    private String specialty;
    @Column(nullable = false, length = 120)
    private String region;
    @Column(nullable = false)
    private boolean available;
    @Column(nullable = false)
    private int capacity;

    protected Technician() {}

    public Technician(UUID id, String name, String registration, String specialty, String region, boolean available, int capacity) {
        this.id = id;
        update(name, registration, specialty, region, available, capacity);
    }

    public void update(String name, String registration, String specialty, String region, boolean available, int capacity) {
        this.name = name;
        this.registration = registration;
        this.specialty = specialty;
        this.region = region;
        this.available = available;
        this.capacity = capacity;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getRegistration() { return registration; }
    public String getSpecialty() { return specialty; }
    public String getRegion() { return region; }
    public boolean isAvailable() { return available; }
    public int getCapacity() { return capacity; }
}
