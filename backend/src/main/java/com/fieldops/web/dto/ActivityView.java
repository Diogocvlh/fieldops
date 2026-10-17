package com.fieldops.web.dto;

import com.fieldops.domain.Activity;
import java.time.Instant;
import java.util.UUID;

public record ActivityView(UUID id, String message, Instant createdAt, UUID workOrderId) {
    public static ActivityView from(Activity activity) {
        return new ActivityView(activity.getId(), activity.getMessage(), activity.getCreatedAt(), activity.getWorkOrderId());
    }
}
