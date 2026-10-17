package com.fieldops.web;

import com.fieldops.domain.WorkOrderStatus;
import com.fieldops.service.ActivityService;
import com.fieldops.service.ReportService;
import com.fieldops.service.SnapshotService;
import com.fieldops.web.dto.ActivityView;
import com.fieldops.web.dto.ReportView;
import com.fieldops.web.dto.SnapshotView;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class OperationsController {
    private final SnapshotService snapshots;
    private final ActivityService activities;
    private final ReportService reports;
    private final Environment environment;

    public OperationsController(SnapshotService snapshots, ActivityService activities, ReportService reports, Environment environment) {
        this.snapshots = snapshots;
        this.activities = activities;
        this.reports = reports;
        this.environment = environment;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "mode", environment.acceptsProfiles(Profiles.of("postgres")) ? "postgres" : "demo");
    }

    @GetMapping("/snapshot")
    public SnapshotView snapshot() { return snapshots.get(); }

    @GetMapping("/activities")
    public List<ActivityView> activities() { return activities.list(); }

    @GetMapping("/reports")
    public ReportView reports(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) WorkOrderStatus status,
            @RequestParam(required = false) UUID technicianId) {
        return reports.get(from, to, status, technicianId);
    }
}
