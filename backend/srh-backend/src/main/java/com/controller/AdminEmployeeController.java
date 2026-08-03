package com.controller;

import com.dto.request.EmployeeRequest;
import com.dto.request.EmployeeUpdateRequest;
import com.dto.response.BulkImportResponse;
import com.dto.response.EmployeeResponse;
import com.dto.response.ErrorResponse;
import com.service.ServiceInterface.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/employees")
@CrossOrigin("*")
@Tag(name = "Admin Employees", description = "Employee account management APIs for ADMIN users, with read access for PROJECT_ADMINISTRATOR and CLIENT roles")
@SecurityRequirement(name = "bearerAuth")
public class AdminEmployeeController {

    private final EmployeeService employeeService;

    public AdminEmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @Operation(summary = "Create employee", description = "Creates a new employee account. Requires ADMIN role.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Employee created",
                    content = @Content(schema = @Schema(implementation = EmployeeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid bearer token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Role is not allowed to create employees",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email or employee code already exists",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = EmployeeRequest.class),
                    examples = @ExampleObject(
                            name = "Create employee",
                            value = """
                                    {
                                      "employeeCode": "EMP-1001",
                                      "email": "employee1001@example.com",
                                      "password": "employee123",
                                      "role": "EMPLOYEE",
                                      "firstName": "Aarav",
                                      "lastName": "Sharma",
                                      "phoneNumber": "9876543210",
                                      "department": "Engineering",
                                      "designation": "Software Engineer",
                                      "location": "Bangalore",
                                      "joiningDate": "2026-06-17",
                                      "status": "ON_BENCH",
                                      "experienceYears": 2.5,
                                      "active": true,
                                      "skills": [],
                                      "certifications": [],
                                      "projectHistory": []
                                    }
                                    """
                    )
            )
    )
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeRequest employee) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(employeeService.saveEmployee(employee));
    }

    @Operation(summary = "List employees", description = "Returns all employee accounts. Requires ADMIN, PROJECT_ADMINISTRATOR, or CLIENT role.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Employees returned",
                    content = @Content(schema = @Schema(implementation = EmployeeResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid bearer token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "403", description = "Role is not allowed to list employees",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_ADMINISTRATOR', 'CLIENT')")
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @Operation(summary = "Get employee by ID", description = "Returns one employee account by database ID. Requires ADMIN, PROJECT_ADMINISTRATOR, or CLIENT role.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_ADMINISTRATOR', 'CLIENT')")
    public ResponseEntity<EmployeeResponse> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @Operation(summary = "Update employee", description = "Updates supplied employee fields. Requires ADMIN role.")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeUpdateRequest employee
    ) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, employee));
    }

    @Operation(summary = "Delete employee", description = "Deletes an employee account by database ID. Requires ADMIN role.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Bulk import employees from CSV or Excel", description = "Imports employees from a CSV or Excel file. Requires ADMIN role.")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BulkImportResponse> importEmployees(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(employeeService.bulkImportEmployees(file));
    }
}

