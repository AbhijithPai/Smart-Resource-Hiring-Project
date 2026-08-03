package com.scheduler;

import com.entity.Employee;
import com.entity.Project;
import com.entity.ProjectRequirement;
import com.enums.EmployeeStatus;
import com.repository.EmployeeRepository;
import com.repository.ProjectRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// Runs once a day. Any project whose endDate has passed and isn't already
// CLOSED gets closed, and every employee assigned to any of its
// requirements is reverted to ON_BENCH. Kept as a standalone component
// (not folded into ProjectServiceImpl) so none of the existing
// shortlist/interview logic is touched by this feature.
@Component
public class ProjectExpiryScheduler {

    private final ProjectRepository projectRepository;
    private final EmployeeRepository employeeRepository;
    private final com.repository.InterviewRepository interviewRepository;

    public ProjectExpiryScheduler(ProjectRepository projectRepository,
                                  EmployeeRepository employeeRepository,
                                  com.repository.InterviewRepository interviewRepository) {
        this.projectRepository = projectRepository;
        this.employeeRepository = employeeRepository;
        this.interviewRepository = interviewRepository;
    }

    // Every day at 00:05 server time or when invoked
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void releaseExpiredProjects() {
        LocalDate today = LocalDate.now();
        List<Project> expired = projectRepository.findByEndDateLessThanEqualAndStatusNot(today, "CLOSED");

        for (Project project : expired) {
            releaseEmployeesForProject(project);
            project.setStatus("CLOSED");
        }

        if (!expired.isEmpty()) {
            projectRepository.saveAll(expired);
        }
    }

    public void releaseEmployeesForProject(Project project) {
        // Release employees from requirements assigned list
        for (ProjectRequirement requirement : project.getRequirements()) {
            Set<Long> assignedIds = parseEmployeeIds(requirement.getAssignedEmployeeIds());
            if (assignedIds.isEmpty()) continue;

            List<Employee> employees = employeeRepository.findAllById(assignedIds);
            employees.forEach(employee -> {
                employee.setStatus(EmployeeStatus.ON_BENCH);
                employee.setAllocationDate(null);
            });
            employeeRepository.saveAll(employees);
        }

        // Release employees associated via interviews for this project
        List<Long> interviewEmpIds = interviewRepository.findByProjectId(project.getId()).stream()
                .map(com.entity.Interview::getEmployeeId)
                .distinct()
                .toList();

        if (!interviewEmpIds.isEmpty()) {
            List<Employee> employees = employeeRepository.findAllById(interviewEmpIds);
            employees.forEach(employee -> {
                if (employee.getStatus() == EmployeeStatus.ALLOCATED || employee.getStatus() == EmployeeStatus.SHORTLISTED) {
                    employee.setStatus(EmployeeStatus.ON_BENCH);
                    employee.setAllocationDate(null);
                }
            });
            employeeRepository.saveAll(employees);
        }
    }

    private Set<Long> parseEmployeeIds(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(id -> !id.isBlank())
                .map(Long::valueOf)
                .collect(Collectors.toSet());
    }
}