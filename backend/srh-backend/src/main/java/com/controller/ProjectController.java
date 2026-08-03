package com.controller;

import com.dto.request.ProjectDurationRequest;
import com.dto.request.ProjectRequest;
import com.dto.response.EmployeeResponse;
import com.dto.response.ErrorResponse;
import com.dto.response.ProjectResponse;
import com.service.ServiceInterface.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin("*")
@Tag(name = "Projects", description = "Demand management — ADMIN can create projects and match employees")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @Operation(summary = "Create project", description = "Creates a new project with requirements. Requires ADMIN role.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Project created",
                    content = @Content(schema = @Schema(implementation = ProjectResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "ADMIN role required",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROJECT_ADMINISTRATOR', 'PROJECT_ADMIN')")
    public ProjectResponse createProject(@Valid @RequestBody ProjectRequest request,
                                         Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        return projectService.createProject(request, email);
    }

    @Operation(summary = "List all projects")
    @ApiResponse(responseCode = "200", description = "Projects returned",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ProjectResponse.class))))
    @GetMapping
    public List<ProjectResponse> getAllProjects(Authentication authentication) {
        boolean isClient = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_CLIENT"));
        return isClient ? projectService.getProjectsForClient(authentication.getName()) : projectService.getAllProjects();
    }

    @Operation(summary = "Get project by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Project returned",
                    content = @Content(schema = @Schema(implementation = ProjectResponse.class))),
            @ApiResponse(responseCode = "404", description = "Project not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ProjectResponse getProjectById(@PathVariable Long id, Authentication authentication) {
        boolean isClient = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_CLIENT"));
        if (!isClient) {
            return projectService.getProjectById(id);
        }
        return projectService.getProjectsForClient(authentication.getName()).stream()
                .filter(project -> project.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Project not found"));
    }

    @Operation(summary = "Update project", description = "Replaces project details and requirements. Requires ADMIN role.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_ADMINISTRATOR', 'PROJECT_ADMIN')")
    public ProjectResponse updateProject(@PathVariable Long id,
                                         @Valid @RequestBody ProjectRequest request) {
        return projectService.updateProject(id, request);
    }

    @Operation(summary = "Extend or reduce project duration",
            description = "Updates the start and end date of an existing project, without touching name/description/requirements. Requires PROJECT_ADMINISTRATOR role.")
    @PutMapping("/{id}/duration")
    @PreAuthorize("hasAnyRole('PROJECT_ADMINISTRATOR', 'PROJECT_ADMIN')")
    public ProjectResponse updateProjectDuration(@PathVariable Long id,
                                                 @Valid @RequestBody ProjectDurationRequest request) {
        return projectService.updateProjectDuration(id, request);
    }

    @Operation(summary = "Delete project", description = "Requires ADMIN role.")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('PROJECT_ADMINISTRATOR', 'PROJECT_ADMIN')")
    public void deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
    }

    @Operation(summary = "Get matching employees",
            description = "Returns employees whose skills and experience match a specific requirement.")
    @ApiResponse(responseCode = "200", description = "Matching employees returned",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = EmployeeResponse.class))))
    @GetMapping("/{projectId}/requirements/{requirementId}/matches")
    public List<EmployeeResponse> getMatchingEmployees(@PathVariable Long projectId,
                                                       @PathVariable Long requirementId) {
        return projectService.getMatchingEmployees(projectId, requirementId);
    }

    @Operation(summary = "Shortlist employees for a requirement",
            description = "Saves selected employee IDs against a requirement and moves ON_BENCH employees to SHORTLISTED. Requires PROJECT_ADMINISTRATOR role.")
    @PostMapping("/{projectId}/requirements/{requirementId}/shortlist")
    @PreAuthorize("hasAnyRole('PROJECT_ADMINISTRATOR', 'PROJECT_ADMIN')")
    public ProjectResponse shortlistEmployees(@PathVariable Long projectId,
                                              @PathVariable Long requirementId,
                                              @RequestBody List<Long> employeeIds) {
        return projectService.shortlistEmployees(projectId, requirementId, employeeIds);
    }

    @Operation(summary = "Assign employees to a requirement",
            description = "Backward-compatible alias for shortlisting employees.")
    @PostMapping("/{projectId}/requirements/{requirementId}/assign")
    @PreAuthorize("hasAnyRole('PROJECT_ADMINISTRATOR', 'PROJECT_ADMIN')")
    public ProjectResponse assignEmployees(@PathVariable Long projectId,
                                           @PathVariable Long requirementId,
                                           @RequestBody List<Long> employeeIds) {
        return projectService.assignEmployees(projectId, requirementId, employeeIds);
    }
}