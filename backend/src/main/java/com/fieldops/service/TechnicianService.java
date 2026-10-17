package com.fieldops.service;

import com.fieldops.domain.Technician;
import com.fieldops.domain.WorkOrderStatus;
import com.fieldops.repository.TechnicianRepository;
import com.fieldops.repository.WorkOrderRepository;
import com.fieldops.web.dto.TechnicianInput;
import com.fieldops.web.dto.TechnicianView;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

@Service
@Validated
public class TechnicianService {
    static final List<WorkOrderStatus> ACTIVE_STATUSES = List.of(WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS);
    private final TechnicianRepository technicians;
    private final WorkOrderRepository orders;
    private final ActivityService activities;

    public TechnicianService(TechnicianRepository technicians, WorkOrderRepository orders, ActivityService activities) {
        this.technicians = technicians;
        this.orders = orders;
        this.activities = activities;
    }

    @Transactional(readOnly = true)
    public List<TechnicianView> list() {
        return technicians.findAllByOrderByNameAsc().stream().map(TechnicianView::from).toList();
    }

    @Transactional
    public TechnicianView create(@Valid TechnicianInput input) {
        if (technicians.existsByRegistrationIgnoreCase(input.registration())) {
            throw BusinessException.conflict("Já existe um técnico com essa matrícula.");
        }
        Technician technician = technicians.saveAndFlush(new Technician(UUID.randomUUID(), input.name(),
                input.registration(), input.specialty(), input.region(), input.available(), input.capacity()));
        activities.record("Técnico " + technician.getName() + " cadastrado.", null);
        return TechnicianView.from(technician);
    }

    @Transactional
    public TechnicianView update(UUID id, @Valid TechnicianInput input) {
        Technician technician = requireLocked(id);
        if (technicians.existsByRegistrationIgnoreCaseAndIdNot(input.registration(), id)) {
            throw BusinessException.conflict("Já existe um técnico com essa matrícula.");
        }
        long workload = orders.countByTechnicianIdAndStatusIn(id, ACTIVE_STATUSES);
        if (input.capacity() < workload) {
            throw BusinessException.conflict("A capacidade não pode ser menor que as " + workload + " ordens ativas do técnico.");
        }
        technician.update(input.name(), input.registration(), input.specialty(), input.region(), input.available(), input.capacity());
        technicians.flush();
        activities.record("Cadastro de " + technician.getName() + " atualizado.", null);
        return TechnicianView.from(technician);
    }

    @Transactional
    public void delete(UUID id) {
        Technician technician = requireLocked(id);
        if (orders.existsByTechnicianId(id)) {
            throw BusinessException.conflict("Este técnico possui ordens vinculadas. Desvincule ou reorganize as ordens antes de excluir.");
        }
        technicians.delete(technician);
        technicians.flush();
        activities.record("Técnico " + technician.getName() + " excluído.", null);
    }

    Technician requireLocked(UUID id) {
        return technicians.findByIdForUpdate(id)
                .orElseThrow(() -> BusinessException.notFound("Técnico não encontrado."));
    }
}
