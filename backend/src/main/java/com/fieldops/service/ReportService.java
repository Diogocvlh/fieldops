package com.fieldops.service;

import com.fieldops.domain.WorkOrder;
import com.fieldops.domain.WorkOrderStatus;
import com.fieldops.repository.TechnicianRepository;
import com.fieldops.repository.WorkOrderRepository;
import com.fieldops.web.dto.ReportView;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Predicate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {
    private final WorkOrderRepository orders;
    private final TechnicianRepository technicians;
    private final Clock clock;

    public ReportService(WorkOrderRepository orders, TechnicianRepository technicians, Clock clock) {
        this.orders = orders;
        this.technicians = technicians;
        this.clock = clock;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ReportView get(LocalDate requestedFrom, LocalDate requestedTo, WorkOrderStatus status, UUID technicianId) {
        LocalDate to = requestedTo == null ? LocalDate.now(clock) : requestedTo;
        LocalDate from = requestedFrom == null ? to.minusDays(29) : requestedFrom;
        if (from.isAfter(to)) throw BusinessException.invalid("from", "A data inicial deve ser anterior ou igual à data final.");
        if (ChronoUnit.DAYS.between(from, to) > 3660) {
            throw BusinessException.invalid("to", "Selecione um período de até 3.661 dias.");
        }
        if (technicianId != null && !technicians.existsById(technicianId)) {
            throw BusinessException.notFound("Técnico não encontrado.");
        }
        Predicate<WorkOrder> matches = order -> (status == null || order.getStatus() == status)
                && (technicianId == null || Objects.equals(order.getTechnicianId(), technicianId));
        List<WorkOrder> matching = orders.findAllByOrderByCreatedAtDescCodeDesc().stream().filter(matches).toList();
        List<WorkOrder> createdInPeriod = matching.stream()
                .filter(order -> between(order.getCreatedAt().atZone(clock.getZone()).toLocalDate(), from, to)).toList();
        long total = createdInPeriod.size();
        long completed = count(createdInPeriod, WorkOrderStatus.COMPLETED);
        long overdue = createdInPeriod.stream().filter(order -> !order.getStatus().isTerminal()
                && order.getDueDate().isBefore(LocalDate.now(clock))).count();
        var totals = new ReportView.Totals(total, count(createdInPeriod, WorkOrderStatus.OPEN),
                count(createdInPeriod, WorkOrderStatus.ASSIGNED), count(createdInPeriod, WorkOrderStatus.IN_PROGRESS),
                completed, count(createdInPeriod, WorkOrderStatus.CANCELLED), overdue,
                total == 0 ? 0 : Math.round(completed * 10000.0 / total) / 100.0);
        var byStatus = Arrays.stream(WorkOrderStatus.values())
                .map(value -> new ReportView.StatusCount(value, count(createdInPeriod, value))).toList();
        var byTechnician = technicians.findAllByOrderByNameAsc().stream()
                .filter(technician -> technicianId == null || technicianId.equals(technician.getId()))
                .map(technician -> {
                    List<WorkOrder> assigned = createdInPeriod.stream()
                            .filter(order -> technician.getId().equals(order.getTechnicianId())).toList();
                    return new ReportView.TechnicianCount(technician.getId(), technician.getName(),
                            count(assigned, WorkOrderStatus.ASSIGNED), count(assigned, WorkOrderStatus.IN_PROGRESS),
                            count(assigned, WorkOrderStatus.COMPLETED), assigned.size());
                }).toList();
        var productivity = from.datesUntil(to.plusDays(1)).map(date -> new ReportView.Productivity(date,
                matching.stream().filter(order -> order.getCompletedAt() != null
                        && order.getCompletedAt().atZone(clock.getZone()).toLocalDate().equals(date)).count())).toList();
        return new ReportView(new ReportView.Criteria(from, to, status, technicianId, "createdAt"),
                totals, byStatus, byTechnician, productivity);
    }

    private boolean between(LocalDate date, LocalDate from, LocalDate to) {
        return !date.isBefore(from) && !date.isAfter(to);
    }

    private long count(List<WorkOrder> records, WorkOrderStatus status) {
        return records.stream().filter(order -> order.getStatus() == status).count();
    }
}
