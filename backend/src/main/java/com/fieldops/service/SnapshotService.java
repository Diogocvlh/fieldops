package com.fieldops.service;

import com.fieldops.web.dto.SnapshotView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SnapshotService {
    private final TechnicianService technicians;
    private final WorkOrderService orders;
    private final ActivityService activities;

    public SnapshotService(TechnicianService technicians, WorkOrderService orders, ActivityService activities) {
        this.technicians = technicians;
        this.orders = orders;
        this.activities = activities;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public SnapshotView get() {
        return new SnapshotView(technicians.list(), orders.list(), activities.list());
    }
}
