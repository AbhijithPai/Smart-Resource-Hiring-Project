package com.controller;

import com.dto.request.EmployeeUpdateRequest;
import com.dto.response.EmployeeProjectResponse;
import com.dto.response.EmployeeResponse;
import com.service.ServiceInterface.EmployeeProjectService;
import com.service.ServiceInterface.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin("*")
@Tag(name = "Employee Profile", description = "Authenticated employee self-service profile APIs")
@SecurityRequirement(name = "bearerAuth")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeProjectService employeeProjectService;

    public EmployeeController(EmployeeService employeeService, EmployeeProjectService employeeProjectService) {
        this.employeeService = employeeService;
        this.employeeProjectService = employeeProjectService;
    }

    @Operation(summary = "View own profile", description = "Returns the profile of the currently authenticated employee.")
    @GetMapping("/me")
    public ResponseEntity<EmployeeResponse> viewOwnProfile(Authentication authentication) {
        return ResponseEntity.ok(employeeService.getEmployeeByEmail(authentication.getName()));
    }

    @Operation(summary = "Update own profile", description = "Updates self-service profile fields for the currently authenticated employee.")
    @PutMapping("/me")
    public ResponseEntity<EmployeeResponse> editOwnProfile(
            Authentication authentication,
            @Valid @RequestBody EmployeeUpdateRequest employee
    ) {
        return ResponseEntity.ok(employeeService.updateOwnProfile(authentication.getName(), employee));
    }

    @Operation(summary = "View my project assignments",
            description = "Returns the projects (with client name and job description) the employee is currently shortlisted or allocated to.")
    @GetMapping("/me/projects")
    public ResponseEntity<List<EmployeeProjectResponse>> viewMyProjects(Authentication authentication) {
        return ResponseEntity.ok(employeeProjectService.getMyProjects(authentication.getName()));
    }
}
