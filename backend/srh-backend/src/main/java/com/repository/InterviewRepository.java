package com.repository;

import com.entity.Interview;
import com.enums.InterviewRound;
import com.enums.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Long> {

    List<Interview> findByEmployeeId(Long employeeId);

    void deleteByEmployeeId(Long employeeId);

    List<Interview> findByProjectId(Long projectId);

    List<Interview> findByRequirementIdAndRoundAndStatus(Long requirementId, InterviewRound round, InterviewStatus status);

    List<Interview> findByEmployeeIdAndProjectId(Long employeeId, Long projectId);

    Optional<Interview> findByEmployeeIdAndProjectIdAndRound(Long employeeId, Long projectId, InterviewRound round);

    List<Interview> findByStatus(InterviewStatus status);
    boolean existsByEmployeeIdAndProjectIdAndRequirementIdAndStatus(Long employeeId, Long projectId, Long requirementId, InterviewStatus status);
}
