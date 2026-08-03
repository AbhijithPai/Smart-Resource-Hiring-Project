package com.service.ServiceImpl;

import com.dto.response.EmployeeProjectResponse;
import com.entity.Employee;
import com.entity.Project;
import com.entity.ProjectRequirement;
import com.enums.EmployeeStatus;
import com.repository.EmployeeRepository;
import com.repository.ProjectRepository;
import com.service.ServiceInterface.EmployeeProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class EmployeeProjectServiceImpl implements EmployeeProjectService {

    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;

    public EmployeeProjectServiceImpl(EmployeeRepository employeeRepository, ProjectRepository projectRepository) {
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
    }

    @Override
    public List<EmployeeProjectResponse> getMyProjects(String employeeEmail) {
        Employee employee = employeeRepository.findByEmail(employeeEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Only visible once shortlisted or allocated - not while just ON_BENCH.
        if (employee.getStatus() != EmployeeStatus.SHORTLISTED && employee.getStatus() != EmployeeStatus.ALLOCATED) {
            return List.of();
        }

        List<EmployeeProjectResponse> result = new ArrayList<>();
        for (Project project : projectRepository.findAll()) {
            for (ProjectRequirement requirement : project.getRequirements()) {
                if (isAssigned(requirement, employee.getId())) {
                    result.add(new EmployeeProjectResponse(
                            project.getId(),
                            project.getName(),
                            project.getDescription(),
                            resolveClientName(project.getClientEmail()),
                            project.getClientEmail(),
                            requirement.getRoleName(),
                            employee.getStatus().name()
                    ));
                }
            }
        }
        return result;
    }

    private boolean isAssigned(ProjectRequirement requirement, Long employeeId) {
        if (requirement.getAssignedEmployeeIds() == null || requirement.getAssignedEmployeeIds().isBlank()) {
            return false;
        }
        return Arrays.stream(requirement.getAssignedEmployeeIds().split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .map(Long::valueOf)
                .anyMatch(id -> id.equals(employeeId));
    }

    // Clients are stored as Employee rows too (role = CLIENT), so we look up
    // their name the same way. Falls back to the raw email if no matching
    // account is found, so the UI never shows a blank client field.
    private String resolveClientName(String clientEmail) {
        if (clientEmail == null || clientEmail.isBlank()) {
            return "Unknown Client";
        }
        return employeeRepository.findByEmail(clientEmail)
                .map(client -> (client.getFirstName() + " " + client.getLastName()).trim())
                .filter(name -> !name.isBlank())
                .orElse(clientEmail);
    }
}