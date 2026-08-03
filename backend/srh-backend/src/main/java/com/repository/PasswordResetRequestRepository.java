package com.repository;

import com.entity.PasswordResetRequest;
import com.enums.PasswordResetStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {

    Optional<PasswordResetRequest> findTopByEmployeeCodeOrderByRequestedAtDesc(String employeeCode);

    List<PasswordResetRequest> findByStatusOrderByRequestedAtDesc(PasswordResetStatus status);

    List<PasswordResetRequest> findAllByOrderByRequestedAtDesc();
}
