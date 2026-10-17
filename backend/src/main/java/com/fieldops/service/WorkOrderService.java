package com.fieldops.service;

import com.fieldops.domain.Technician;
import com.fieldops.domain.WorkOrder;
import com.fieldops.domain.WorkOrderStatus;
import com.fieldops.repository.WorkOrderRepository;
import com.fieldops.web.dto.WorkOrderInput;
import com.fieldops.web.dto.WorkOrderView;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

@Service
@Validated
public class WorkOrderService {
    private final WorkOrderRepository orders;
    private final TechnicianService technicians;
    private final ActivityService activities;
    private final Clock clock;

    public WorkOrderService(WorkOrderRepository orders, TechnicianService technicians, ActivityService activities, Clock clock) {
        this.orders = orders;
        this.technicians = technicians;
        this.activities = activities;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<WorkOrderView> list() {
        return orders.findAllByOrderByCreatedAtDescCodeDesc().stream().map(WorkOrderView::from).toList();
    }

    @Transactional
    public WorkOrderView create(@Valid WorkOrderInput input) {
        validate(input, null);
        String code = "OS-%d-%06d".formatted(LocalDate.now(clock).getYear(), orders.nextOrderNumber());
        WorkOrder order = orders.saveAndFlush(new WorkOrder(UUID.randomUUID(), code, input.title(), input.description(),
                input.technicianId(), input.priority(), input.status(), input.dueDate(), clock.instant()));
        String assignment = order.getTechnicianId() == null ? ""
                : " Técnico: " + technicians.requireLocked(order.getTechnicianId()).getName() + ".";
        activities.record(order.getCode() + " criada: " + order.getTitle() + ". Status: "
                + order.getStatus().label() + "." + assignment, order.getId());
        return WorkOrderView.from(order);
    }

    @Transactional
    public WorkOrderView update(UUID id, @Valid WorkOrderInput input) {
        WorkOrder order = requireLocked(id);
        validate(input, order);
        WorkOrderStatus previous = order.getStatus();
        UUID previousTechnician = order.getTechnicianId();
        applyInput(order, input);
        orders.flush();
        String message;
        if (!Objects.equals(previousTechnician, order.getTechnicianId()) && order.getTechnicianId() != null) {
            message = order.getCode() + " atribuída a " + technicians.requireLocked(order.getTechnicianId()).getName() + ".";
        } else if (previous != order.getStatus()) {
            message = order.getCode() + ": status alterado para " + order.getStatus().label() + ".";
        } else {
            message = order.getCode() + " atualizada.";
        }
        activities.record(message, order.getId());
        return WorkOrderView.from(order);
    }

    @Transactional
    public WorkOrderView assign(UUID id, UUID technicianId) {
        WorkOrder order = requireLocked(id);
        if (order.getStatus().isTerminal()) {
            throw BusinessException.conflict("Reabra a ordem antes de atribuir um técnico.");
        }
        if (technicianId == null) throw BusinessException.invalid("technicianId", "Selecione um técnico.");
        WorkOrderInput input = new WorkOrderInput(order.getTitle(), order.getDescription(), technicianId,
                order.getPriority(), WorkOrderStatus.ASSIGNED, order.getDueDate());
        validate(input, order);
        applyInput(order, input);
        orders.flush();
        activities.record(order.getCode() + " atribuída a " + technicians.requireLocked(technicianId).getName() + ".", order.getId());
        return WorkOrderView.from(order);
    }

    @Transactional
    public void delete(UUID id) {
        WorkOrder order = requireLocked(id);
        lockTechnicians(order.getTechnicianId(), null);
        activities.record(order.getCode() + " excluída: " + order.getTitle() + ".", order.getId());
        orders.delete(order);
        orders.flush();
    }

    private WorkOrder requireLocked(UUID id) {
        return orders.findByIdForUpdate(id)
                .orElseThrow(() -> BusinessException.notFound("Ordem de serviço não encontrada."));
    }

    private void applyInput(WorkOrder order, WorkOrderInput input) {
        order.update(input.title(), input.description(), input.technicianId(), input.priority(),
                input.status(), input.dueDate(), clock.instant());
    }

    private void validate(WorkOrderInput input, WorkOrder existing) {
        LocalDate openingDate = existing == null ? LocalDate.now(clock)
                : existing.getCreatedAt().atZone(clock.getZone()).toLocalDate();
        if (input.dueDate().isBefore(openingDate)) {
            throw BusinessException.invalid("dueDate", "O prazo não pode ser anterior à data de abertura da ordem.");
        }
        if (input.status() == WorkOrderStatus.OPEN && input.technicianId() != null) {
            throw BusinessException.invalid("technicianId", "Uma ordem aberta não pode ter técnico atribuído. Use o status Atribuída.");
        }
        if (input.status().isActive() && input.technicianId() == null) {
            throw BusinessException.invalid("technicianId", "Selecione um técnico para ordens atribuídas ou em andamento.");
        }
        UUID previousId = existing == null ? null : existing.getTechnicianId();
        Map<UUID, Technician> locked = lockTechnicians(previousId, input.technicianId());
        if (input.technicianId() == null) return;
        Technician target = locked.get(input.technicianId());
        boolean sameActiveAssignment = existing != null && existing.getStatus().isActive()
                && Objects.equals(previousId, input.technicianId());
        boolean newTechnician = !Objects.equals(previousId, input.technicianId());
        if ((input.status().isActive() && !sameActiveAssignment) || newTechnician) {
            if (!target.isAvailable()) throw BusinessException.conflict("O técnico selecionado está indisponível.");
            long workload = orders.countByTechnicianIdAndStatusIn(target.getId(), TechnicianService.ACTIVE_STATUSES);
            if (workload >= target.getCapacity()) {
                throw BusinessException.conflict("O técnico selecionado atingiu sua capacidade de " + target.getCapacity() + " ordens ativas.");
            }
        }
    }

    // Every change affecting workload locks both technicians in a stable order.
    // The database, rather than a JVM mutex, serializes assignments across API instances.
    private Map<UUID, Technician> lockTechnicians(UUID previousId, UUID nextId) {
        Map<UUID, Technician> locked = new HashMap<>();
        Stream.of(previousId, nextId).filter(Objects::nonNull).distinct().sorted()
                .forEach(id -> locked.put(id, technicians.requireLocked(id)));
        return locked;
    }
}
