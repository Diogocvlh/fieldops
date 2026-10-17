package com.fieldops.repository;

import com.fieldops.domain.Technician;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface TechnicianRepository extends JpaRepository<Technician, UUID> {
    List<Technician> findAllByOrderByNameAsc();
    boolean existsByRegistrationIgnoreCase(String registration);
    boolean existsByRegistrationIgnoreCaseAndIdNot(String registration, UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select technician from Technician technician where technician.id = :id")
    Optional<Technician> findByIdForUpdate(UUID id);
}
