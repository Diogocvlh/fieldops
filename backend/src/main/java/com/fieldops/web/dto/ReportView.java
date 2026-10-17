package com.fieldops.web.dto;

import com.fieldops.domain.WorkOrderStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ReportView(Criteria criteria, Totals totals, List<StatusCount> byStatus,
        List<TechnicianCount> byTechnician, List<Productivity> productivity) {
    public record Criteria(LocalDate from, LocalDate to, WorkOrderStatus status, UUID technicianId, String dateBasis) {}
    public record Totals(long total, long open, long assigned, long inProgress, long completed,
            long cancelled, long overdue, double completionRate) {}
    public record StatusCount(WorkOrderStatus status, long total) {}
    public record TechnicianCount(UUID technicianId, String name, long assigned, long inProgress, long completed, long total) {}
    public record Productivity(LocalDate date, long completed) {}
}
