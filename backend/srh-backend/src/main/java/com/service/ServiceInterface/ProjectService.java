package com.service.ServiceInterface;

import com.dto.request.ProjectDurationRequest;
import com.dto.request.ProjectRequest;
import com.dto.response.EmployeeResponse;
import com.dto.response.ProjectResponse;

import java.util.List;

public interface ProjectService {

    ProjectResponse createProject(ProjectRequest request, String createdByEmail);

    List<ProjectResponse> getAllProjects();

    List<ProjectResponse> getProjectsForClient(String clientEmail);

    ProjectResponse getProjectById(Long id);

    ProjectResponse updateProject(Long id, ProjectRequest request);

    void deleteProject(Long id);

    List<EmployeeResponse> getMatchingEmployees(Long projectId, Long requirementId);

    ProjectResponse shortlistEmployees(Long projectId, Long requirementId, List<Long> employeeIds);

    ProjectResponse assignEmployees(Long projectId, Long requirementId, List<Long> employeeIds);

    // NEW
    ProjectResponse updateProjectDuration(Long id, ProjectDurationRequest request);
}