package com.fieldops.config;

import com.fieldops.domain.Activity;
import com.fieldops.domain.Priority;
import com.fieldops.domain.Technician;
import com.fieldops.domain.WorkOrder;
import com.fieldops.domain.WorkOrderStatus;
import com.fieldops.repository.ActivityRepository;
import com.fieldops.repository.TechnicianRepository;
import com.fieldops.repository.WorkOrderRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo")
@ConditionalOnProperty(name = "fieldops.seed-enabled", havingValue = "true")
public class DemoDataInitializer implements CommandLineRunner {
    private static final Logger LOG = LoggerFactory.getLogger(DemoDataInitializer.class);
    private final TechnicianRepository technicians;
    private final WorkOrderRepository orders;
    private final ActivityRepository activities;
    private final Clock clock;

    public DemoDataInitializer(TechnicianRepository technicians, WorkOrderRepository orders, ActivityRepository activities, Clock clock) {
        this.technicians = technicians;
        this.orders = orders;
        this.activities = activities;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (technicians.count() != 0 || orders.count() != 0) return;
        List<Technician> team = List.of(
                technician("Marina Tavares", "TEC-001", "Elétrica", "Centro", true),
                technician("Caio Vilar", "TEC-002", "Refrigeração", "Zona Norte", true),
                technician("Lívia Campos", "TEC-003", "Redes e conectividade", "Zona Sul", true),
                technician("Rafael Neri", "TEC-004", "Manutenção predial", "Zona Leste", true),
                technician("Beatriz Azevedo", "TEC-005", "Automação", "Zona Oeste", true),
                technician("Davi Fontes", "TEC-006", "Mecânica", "Centro", false));
        technicians.saveAllAndFlush(team);
        String[] titles = {
                "Inspecionar quadro de distribuição", "Revisar sistema de climatização", "Restabelecer ponto de rede",
                "Substituir luminárias do corredor", "Calibrar sensores de presença", "Revisar conjunto de bombeamento",
                "Avaliar ruído no equipamento", "Executar manutenção preventiva", "Verificar circuito de emergência",
                "Ajustar temperatura da sala técnica", "Organizar cabeamento estruturado", "Inspecionar vedação hidráulica"
        };
        WorkOrderStatus[] statuses = {WorkOrderStatus.OPEN, WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS,
                WorkOrderStatus.COMPLETED, WorkOrderStatus.COMPLETED, WorkOrderStatus.OPEN,
                WorkOrderStatus.CANCELLED, WorkOrderStatus.IN_PROGRESS};
        Instant now = clock.instant();
        for (int index = 0; index < 32; index++) {
            int daysAgo = (31 - index) % 24 + 1;
            Instant createdAt = now.minus(Duration.ofDays(daysAgo));
            LocalDate openingDate = createdAt.atZone(clock.getZone()).toLocalDate();
            WorkOrderStatus status = statuses[index % statuses.length];
            UUID technicianId = status == WorkOrderStatus.OPEN ? null : team.get(index % team.size()).getId();
            String title = titles[index % titles.length];
            LocalDate dueDate = openingDate.plusDays(index % 3 == 0 ? 2 : 7);
            WorkOrder order = new WorkOrder(UUID.randomUUID(),
                    "OS-%d-%06d".formatted(openingDate.getYear(), orders.nextOrderNumber()), title,
                    "Registro fictício para demonstração. Unidade " + (index % 6 + 1)
                            + ": realizar diagnóstico, registrar o atendimento e validar o funcionamento.",
                    technicianId, Priority.values()[index % Priority.values().length],
                    status == WorkOrderStatus.COMPLETED ? WorkOrderStatus.IN_PROGRESS : status, dueDate, createdAt);
            if (status == WorkOrderStatus.COMPLETED) {
                Instant completedAt = now.minus(Duration.ofDays(Math.max(0, daysAgo - 2)));
                order.update(title, order.getDescription(), technicianId, order.getPriority(), status, dueDate, completedAt);
            }
            orders.saveAndFlush(order);
            activities.save(new Activity(order.getCode() + ": " + status.label().toLowerCase() + " — " + title + ".",
                    order.getUpdatedAt(), order.getId()));
        }
        LOG.info("FieldOps em modo demonstração: 6 técnicos e 32 ordens fictícias. Os dados H2 são descartados ao reiniciar.");
    }

    private Technician technician(String name, String registration, String specialty, String region, boolean available) {
        return new Technician(UUID.randomUUID(), name, registration, specialty, region, available, 6);
    }
}
