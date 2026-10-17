package com.fieldops.repository;

import com.fieldops.domain.WorkOrder;
import com.fieldops.domain.WorkOrderStatus;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {
    List<WorkOrder> findAllByOrderByCreatedAtDescCodeDesc();
    boolean existsByTechnicianId(UUID technicianId);
    long countByTechnicianIdAndStatusIn(UUID technicianId, Collection<WorkOrderStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select workOrder from WorkOrder workOrder where workOrder.id = :id")
    Optional<WorkOrder> findByIdForUpdate(UUID id);

    @Query(value = "select nextval('fieldops.work_order_number')", nativeQuery = true)
    long nextOrderNumber();
}
