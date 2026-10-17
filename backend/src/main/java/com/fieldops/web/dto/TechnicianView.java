package com.fieldops.web.dto;

import com.fieldops.domain.Technician;
import java.util.UUID;

public record TechnicianView(UUID id, String name, String registration, String specialty,
        String region, boolean available, int capacity) {
    public static TechnicianView from(Technician technician) {
        return new TechnicianView(technician.getId(), technician.getName(), technician.getRegistration(),
                technician.getSpecialty(), technician.getRegion(), technician.isAvailable(), technician.getCapacity());
    }
}
