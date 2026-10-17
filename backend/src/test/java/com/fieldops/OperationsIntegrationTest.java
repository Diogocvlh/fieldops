package com.fieldops;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fieldops.domain.Priority;
import com.fieldops.domain.WorkOrderStatus;
import com.fieldops.repository.ActivityRepository;
import com.fieldops.repository.WorkOrderRepository;
import com.fieldops.service.BusinessException;
import com.fieldops.service.ReportService;
import com.fieldops.service.SnapshotService;
import com.fieldops.service.TechnicianService;
import com.fieldops.service.WorkOrderService;
import com.fieldops.web.dto.TechnicianInput;
import com.fieldops.web.dto.TechnicianView;
import com.fieldops.web.dto.WorkOrderInput;
import com.fieldops.web.dto.WorkOrderView;
import jakarta.validation.ConstraintViolationException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
        "fieldops.seed-enabled=false",
        "spring.datasource.url=jdbc:h2:mem:fieldops-tests;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"
})
@ActiveProfiles("demo")
@Import(OperationsIntegrationTest.TestClockConfiguration.class)
class OperationsIntegrationTest {
    @Autowired TechnicianService technicians;
    @Autowired WorkOrderService orders;
    @Autowired SnapshotService snapshots;
    @Autowired ReportService reports;
    @Autowired WorkOrderRepository orderRepository;
    @Autowired ActivityRepository activityRepository;
    @Autowired JdbcTemplate jdbc;
    @Autowired AdjustableClock clock;

    @BeforeEach
    void cleanDatabase() {
        jdbc.update("delete from fieldops.activities");
        jdbc.update("delete from fieldops.work_orders");
        jdbc.update("delete from fieldops.technicians");
        clock.set(Instant.parse("2026-10-17T01:00:00Z"));
    }

    @Test
    void generatesUniqueIdentifiersAndImmutableReadableCodes() {
        WorkOrderView first = orders.create(openOrder());
        WorkOrderView second = orders.create(openOrder());
        WorkOrderView updated = orders.update(first.id(), new WorkOrderInput("Título atualizado", "Diagnóstico",
                null, Priority.CRITICAL, WorkOrderStatus.OPEN, today()));

        assertThat(first.id()).isNotEqualTo(second.id());
        assertThat(first.code()).matches("OS-2026-\\d{6,}").isNotEqualTo(second.code());
        assertThat(updated.code()).isEqualTo(first.code());
        assertThat(updated.createdAt()).isEqualTo(first.createdAt());
        assertThat(activityRepository.count()).isEqualTo(3);
    }

    @Test
    void unavailableAssignmentRollsBackOrderAndActivity() {
        TechnicianView technician = technicians.create(technician("TEC-01", false, 2));
        WorkOrderView order = orders.create(openOrder());
        long activityCount = activityRepository.count();

        assertConflict(() -> orders.assign(order.id(), technician.id()), "indisponível");

        WorkOrderView unchanged = orders.list().getFirst();
        assertThat(unchanged.status()).isEqualTo(WorkOrderStatus.OPEN);
        assertThat(unchanged.technicianId()).isNull();
        assertThat(activityRepository.count()).isEqualTo(activityCount);
    }

    @Test
    void capacityIsEnforcedAndCompletionReleasesWorkload() {
        TechnicianView technician = technicians.create(technician("TEC-01", true, 1));
        WorkOrderView first = orders.create(openOrder());
        WorkOrderView second = orders.create(openOrder());
        WorkOrderView assigned = orders.assign(first.id(), technician.id());

        assertConflict(() -> orders.assign(second.id(), technician.id()), "capacidade");

        orders.update(first.id(), input(assigned, WorkOrderStatus.COMPLETED, technician.id()));
        assertThat(orders.assign(second.id(), technician.id()).status()).isEqualTo(WorkOrderStatus.ASSIGNED);
    }

    @Test
    void completionTimestampIsAutomaticPreservedOnEditAndClearedOnReopen() {
        WorkOrderView order = orders.create(openOrder());
        WorkOrderView completed = orders.update(order.id(), input(order, WorkOrderStatus.COMPLETED, null));
        assertThat(completed.completedAt()).isEqualTo(clock.instant());

        clock.advance(Duration.ofHours(1));
        WorkOrderView edited = orders.update(order.id(), input(completed, WorkOrderStatus.COMPLETED, null));
        assertThat(edited.completedAt()).isEqualTo(completed.completedAt());

        WorkOrderView reopened = orders.update(order.id(), input(edited, WorkOrderStatus.OPEN, null));
        assertThat(reopened.completedAt()).isNull();
        assertThat(reopened.updatedAt()).isAfter(reopened.createdAt());
    }

    @Test
    void reopeningWithHistoricalTechnicianChecksAvailabilityAndCapacity() {
        TechnicianView technician = technicians.create(technician("TEC-01", true, 1));
        WorkOrderView order = orders.create(openOrder());
        WorkOrderView assigned = orders.assign(order.id(), technician.id());
        WorkOrderView completed = orders.update(order.id(), input(assigned, WorkOrderStatus.COMPLETED, technician.id()));
        WorkOrderView other = orders.create(openOrder());
        orders.assign(other.id(), technician.id());

        assertConflict(() -> orders.update(order.id(), input(completed, WorkOrderStatus.IN_PROGRESS, technician.id())), "capacidade");

        technicians.update(technician.id(), technician("TEC-01", false, 1));
        assertConflict(() -> orders.update(order.id(), input(completed, WorkOrderStatus.IN_PROGRESS, technician.id())), "indisponível");
        assertThat(orderRepository.findById(order.id()).orElseThrow().getCompletedAt()).isNotNull();
    }

    @Test
    void retainingSameActiveTechnicianAllowsEditingAfterAvailabilityChanges() {
        TechnicianView technician = technicians.create(technician("TEC-01", true, 1));
        WorkOrderView assigned = orders.assign(orders.create(openOrder()).id(), technician.id());
        technicians.update(technician.id(), technician("TEC-01", false, 1));

        WorkOrderView updated = orders.update(assigned.id(), input(assigned, WorkOrderStatus.IN_PROGRESS, technician.id()));

        assertThat(updated.status()).isEqualTo(WorkOrderStatus.IN_PROGRESS);
        assertThat(updated.technicianId()).isEqualTo(technician.id());
    }

    @Test
    void rejectsInvalidStatusAssignmentCombinationsAndOpeningDeadline() {
        TechnicianView technician = technicians.create(technician("TEC-01", true, 3));
        assertThatThrownBy(() -> orders.create(new WorkOrderInput("Inspeção", "", technician.id(), Priority.HIGH,
                WorkOrderStatus.OPEN, today()))).isInstanceOf(BusinessException.class).hasMessageContaining("aberta");
        assertThatThrownBy(() -> orders.create(new WorkOrderInput("Inspeção", "", null, Priority.HIGH,
                WorkOrderStatus.IN_PROGRESS, today()))).isInstanceOf(BusinessException.class).hasMessageContaining("Selecione");
        assertThatThrownBy(() -> orders.create(new WorkOrderInput("Inspeção", "", null, Priority.HIGH,
                WorkOrderStatus.OPEN, today().minusDays(1)))).isInstanceOf(BusinessException.class).hasMessageContaining("prazo");
        assertThat(orders.list()).isEmpty();
    }

    @Test
    void validatesInputsAtServiceBoundary() {
        assertThatThrownBy(() -> orders.create(new WorkOrderInput(" ", "", null, null, WorkOrderStatus.OPEN, today())))
                .isInstanceOf(ConstraintViolationException.class);
        assertThatThrownBy(() -> technicians.create(technician("TEC-01", true, 21)))
                .isInstanceOf(ConstraintViolationException.class);
        assertThat(snapshots.get().orders()).isEmpty();
        assertThat(snapshots.get().technicians()).isEmpty();
    }

    @Test
    void preventsCapacityReductionBelowExistingWorkload() {
        TechnicianView technician = technicians.create(technician("TEC-01", true, 2));
        orders.assign(orders.create(openOrder()).id(), technician.id());
        orders.assign(orders.create(openOrder()).id(), technician.id());

        assertConflict(() -> technicians.update(technician.id(), technician("TEC-01", true, 1)), "capacidade");
        assertThat(technicians.list().getFirst().capacity()).isEqualTo(2);
    }

    @Test
    void linkedTechnicianCannotBeDeletedAndOrderDeletionPreservesHistory() {
        TechnicianView technician = technicians.create(technician("TEC-01", true, 2));
        WorkOrderView assigned = orders.assign(orders.create(openOrder()).id(), technician.id());
        WorkOrderView completed = orders.update(assigned.id(), input(assigned, WorkOrderStatus.COMPLETED, technician.id()));

        assertConflict(() -> technicians.delete(technician.id()), "vinculadas");
        orders.delete(completed.id());
        technicians.delete(technician.id());

        assertThat(snapshots.get().orders()).isEmpty();
        assertThat(snapshots.get().technicians()).isEmpty();
        assertThat(snapshots.get().activities()).anyMatch(activity -> activity.message().contains(completed.code() + " excluída"));
        assertThat(snapshots.get().activities()).allMatch(activity -> activity.workOrderId() == null);
    }

    @Test
    void registrationIsNormalizedAndUniqueOnCreateAndUpdate() {
        TechnicianView first = technicians.create(technician("  tec-01  ", true, 2));
        TechnicianView second = technicians.create(technician("TEC-02", true, 2));
        assertThat(first.registration()).isEqualTo("TEC-01");

        assertConflict(() -> technicians.create(technician("TeC-01", true, 2)), "matrícula");
        assertConflict(() -> technicians.update(second.id(), technician("tec-01", true, 2)), "matrícula");
        assertThat(technicians.update(first.id(), technician("tec-01", true, 3)).capacity()).isEqualTo(3);
    }

    @Test
    void terminalOrderRequiresReopeningBeforeAssignment() {
        TechnicianView technician = technicians.create(technician("TEC-01", true, 2));
        WorkOrderView open = orders.create(openOrder());
        WorkOrderView cancelled = orders.update(open.id(), input(open, WorkOrderStatus.CANCELLED, null));
        assertConflict(() -> orders.assign(cancelled.id(), technician.id()), "Reabra");
        assertThat(cancelled.completedAt()).isNull();
        WorkOrderView reopened = orders.update(open.id(), input(cancelled, WorkOrderStatus.OPEN, null));
        assertThat(orders.assign(reopened.id(), technician.id()).status()).isEqualTo(WorkOrderStatus.ASSIGNED);
    }

    @Test
    void reportsUseLocalCreationDateAndSeparateCompletionDateForProductivity() {
        LocalDate creationDate = today();
        WorkOrderView order = orders.create(openOrder());
        clock.advance(Duration.ofHours(3)); // 04:00 UTC is the following day in São Paulo.
        LocalDate completionDate = today();
        orders.update(order.id(), input(order, WorkOrderStatus.COMPLETED, null));

        var creationReport = reports.get(creationDate, creationDate, null, null);
        var completionReport = reports.get(completionDate, completionDate, null, null);

        assertThat(creationReport.totals().total()).isEqualTo(1);
        assertThat(creationReport.totals().completionRate()).isEqualTo(100);
        assertThat(creationReport.productivity().getFirst().completed()).isZero();
        assertThat(completionReport.totals().total()).isZero();
        assertThat(completionReport.productivity().getFirst().completed()).isEqualTo(1);
        assertThat(creationReport.criteria().dateBasis()).isEqualTo("createdAt");
        assertThatThrownBy(() -> reports.get(completionDate, creationDate, null, null))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void simultaneousAssignmentsCannotExceedTechnicianCapacity() throws Exception {
        TechnicianView technician = technicians.create(technician("TEC-01", true, 1));
        List<UUID> ids = List.of(orders.create(openOrder()).id(), orders.create(openOrder()).id());
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var futures = ids.stream().map(id -> executor.submit(() -> {
                ready.countDown();
                if (!start.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("Timeout do teste");
                try {
                    orders.assign(id, technician.id());
                    return true;
                } catch (BusinessException exception) {
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    return false;
                }
            })).toList();
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            int successful = 0;
            for (var future : futures) if (future.get(10, TimeUnit.SECONDS)) successful++;
            assertThat(successful).isEqualTo(1);
        }
        assertThat(orders.list().stream().filter(order -> order.status().isActive()).count()).isEqualTo(1);
    }

    private WorkOrderInput openOrder() {
        return new WorkOrderInput("Inspecionar equipamento", "Descrição fictícia", null,
                Priority.MEDIUM, WorkOrderStatus.OPEN, today());
    }

    private TechnicianInput technician(String registration, boolean available, int capacity) {
        return new TechnicianInput("Marina Tavares", registration, "Elétrica", "Centro", available, capacity);
    }

    private WorkOrderInput input(WorkOrderView order, WorkOrderStatus status, UUID technicianId) {
        return new WorkOrderInput(order.title(), order.description(), technicianId, order.priority(), status, order.dueDate());
    }

    private LocalDate today() { return LocalDate.now(clock); }

    private void assertConflict(Runnable operation, String message) {
        assertThatThrownBy(operation::run).isInstanceOfSatisfying(BusinessException.class, exception -> {
            assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(exception.getMessage()).contains(message);
        });
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestClockConfiguration {
        @Bean @Primary
        AdjustableClock testClock() { return new AdjustableClock(); }
    }

    static final class AdjustableClock extends Clock {
        private final AtomicReference<Instant> current = new AtomicReference<>(Instant.parse("2026-10-17T01:00:00Z"));
        void set(Instant instant) { current.set(instant); }
        void advance(Duration duration) { current.updateAndGet(instant -> instant.plus(duration)); }
        @Override public ZoneId getZone() { return ZoneId.of("America/Sao_Paulo"); }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(instant(), zone); }
        @Override public Instant instant() { return current.get(); }
    }
}
