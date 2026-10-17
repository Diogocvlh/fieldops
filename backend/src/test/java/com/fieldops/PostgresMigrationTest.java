package com.fieldops;

import static org.assertj.core.api.Assertions.assertThat;

import com.fieldops.domain.Priority;
import com.fieldops.domain.WorkOrderStatus;
import com.fieldops.service.TechnicianService;
import com.fieldops.service.WorkOrderService;
import com.fieldops.web.dto.TechnicianInput;
import com.fieldops.web.dto.WorkOrderInput;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/** Uses a real PostgreSQL only when CI or the developer explicitly supplies DB_URL. */
@SpringBootTest(properties = "fieldops.seed-enabled=false")
@ActiveProfiles("postgres")
@EnabledIfEnvironmentVariable(named = "DB_URL", matches = "jdbc:postgresql:.*")
class PostgresMigrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired TechnicianService technicians;
    @Autowired WorkOrderService orders;

    @Test
    void appliesMigrationsAndPersistsCompleteLifecycleInDedicatedSchema() {
        assertThat(jdbc.queryForObject("select count(*) from information_schema.tables where table_schema = 'fieldops' and table_name in ('technicians', 'work_orders', 'activities')", Integer.class)).isEqualTo(3);
        assertThat(jdbc.queryForObject("select count(*) from fieldops.flyway_schema_history where success = true", Integer.class)).isGreaterThanOrEqualTo(1);
        var technician = technicians.create(new TechnicianInput("Técnico de integração",
                "CI-" + UUID.randomUUID().toString().substring(0, 8), "Elétrica", "Centro", true, 2));
        var order = orders.create(new WorkOrderInput("Validar integração PostgreSQL", "Registro do teste automatizado",
                null, Priority.HIGH, WorkOrderStatus.OPEN, LocalDate.now(ZoneId.of("America/Sao_Paulo"))));
        try {
            var assigned = orders.assign(order.id(), technician.id());
            var completed = orders.update(order.id(), new WorkOrderInput(assigned.title(), assigned.description(),
                    technician.id(), assigned.priority(), WorkOrderStatus.COMPLETED, assigned.dueDate()));
            assertThat(completed.completedAt()).isNotNull();
            assertThat(jdbc.queryForObject("select status from fieldops.work_orders where id = ?", String.class, order.id())).isEqualTo("COMPLETED");
        } finally {
            orders.delete(order.id());
            technicians.delete(technician.id());
        }
    }
}
