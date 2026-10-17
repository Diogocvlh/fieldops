package com.fieldops.service;

import com.fieldops.domain.Activity;
import com.fieldops.repository.ActivityRepository;
import com.fieldops.web.dto.ActivityView;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityService {
    private final ActivityRepository activities;
    private final Clock clock;

    public ActivityService(ActivityRepository activities, Clock clock) {
        this.activities = activities;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(String message, UUID workOrderId) {
        activities.saveAndFlush(new Activity(message, clock.instant(), workOrderId));
    }

    @Transactional(readOnly = true)
    public List<ActivityView> list() {
        return activities.findAllByOrderByCreatedAtDescIdAsc().stream().map(ActivityView::from).toList();
    }
}
