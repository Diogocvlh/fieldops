package com.fieldops.web.dto;

import java.util.List;

public record SnapshotView(List<TechnicianView> technicians, List<WorkOrderView> orders, List<ActivityView> activities) {}
