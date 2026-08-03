// ─── ProjectRepository.java ───────────────────────────────────────────────────
package com.repository;

import com.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCreatedBy(String createdBy);
    List<Project> findByClientEmailIgnoreCase(String clientEmail);
    List<Project> findByStatus(String status);
    List<Project> findByEndDateBeforeAndStatusNot(LocalDate date, String status);
    List<Project> findByEndDateLessThanEqualAndStatusNot(LocalDate date, String status);
}
