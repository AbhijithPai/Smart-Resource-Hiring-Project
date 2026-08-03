package com.controller;

import com.dto.request.EmployeeRequest;
import com.dto.request.EmployeeUpdateRequest;
import com.dto.response.EmployeeResponse;
import com.enums.Role;
import com.service.ServiceInterface.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminEmployeeControllerTest extends ControllerTestSupport {

    private MockMvc mockMvc;

    @Mock
    private EmployeeService employeeService;

    @BeforeEach
    void setUp() {
        mockMvc = mockMvcFor(new AdminEmployeeController(employeeService));
    }

    @Test
    void createEmployeeReturnsCreatedEmployee() throws Exception {
        EmployeeRequest request = employeeRequest();
        EmployeeResponse response = employeeResponse(1L, "EMP-1001", "aarav.sharma@example.com", Role.EMPLOYEE);

        when(employeeService.saveEmployee(any(EmployeeRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/admin/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.employeeCode").value("EMP-1001"))
                .andExpect(jsonPath("$.email").value("aarav.sharma@example.com"))
                .andExpect(jsonPath("$.role").value("EMPLOYEE"));

        verify(employeeService).saveEmployee(any(EmployeeRequest.class));
    }

    @Test
    void createEmployeeRejectsMissingRequiredFields() throws Exception {
        EmployeeRequest request = new EmployeeRequest();
        request.setEmail("not-an-email");
        request.setPassword("short");

        mockMvc.perform(post("/api/admin/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/admin/employees"));

        verifyNoInteractions(employeeService);
    }

    @Test
    void getAllEmployeesReturnsEmployeeList() throws Exception {
        when(employeeService.getAllEmployees()).thenReturn(List.of(
                employeeResponse(1L, "EMP-1001", "aarav.sharma@example.com", Role.EMPLOYEE),
                employeeResponse(2L, "EMP-1002", "meera.iyer@example.com", Role.PROJECT_ADMIN)
        ));

        mockMvc.perform(get("/api/admin/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].employeeCode").value("EMP-1001"))
                .andExpect(jsonPath("$[1].role").value("PROJECT_ADMIN"));

        verify(employeeService).getAllEmployees();
    }

    @Test
    void getEmployeeByIdReturnsEmployee() throws Exception {
        when(employeeService.getEmployeeById(1L))
                .thenReturn(employeeResponse(1L, "EMP-1001", "aarav.sharma@example.com", Role.EMPLOYEE));

        mockMvc.perform(get("/api/admin/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("aarav.sharma@example.com"));

        verify(employeeService).getEmployeeById(1L);
    }

    @Test
    void getEmployeeByIdReturnsNotFoundWhenMissing() throws Exception {
        when(employeeService.getEmployeeById(99L))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        mockMvc.perform(get("/api/admin/employees/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Employee not found"))
                .andExpect(jsonPath("$.path").value("/api/admin/employees/99"));
    }

    @Test
    void updateEmployeeReturnsUpdatedEmployee() throws Exception {
        EmployeeUpdateRequest request = employeeUpdateRequest();
        when(employeeService.updateEmployee(eq(1L), any(EmployeeUpdateRequest.class)))
                .thenReturn(employeeResponse(1L, "EMP-1001", "updated@example.com", Role.EMPLOYEE));

        mockMvc.perform(put("/api/admin/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("updated@example.com"))
                .andExpect(jsonPath("$.firstName").value("Aarav"));

        verify(employeeService).updateEmployee(eq(1L), any(EmployeeUpdateRequest.class));
    }

    @Test
    void updateEmployeeRejectsInvalidEmail() throws Exception {
        EmployeeUpdateRequest request = new EmployeeUpdateRequest();
        request.setEmail("bad-email");

        mockMvc.perform(put("/api/admin/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/admin/employees/1"));

        verifyNoInteractions(employeeService);
    }

    @Test
    void deleteEmployeeReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/admin/employees/1"))
                .andExpect(status().isNoContent());

        verify(employeeService).deleteEmployee(1L);
    }

    @Test
    void deleteEmployeeReturnsNotFoundWhenMissing() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"))
                .when(employeeService).deleteEmployee(99L);

        mockMvc.perform(delete("/api/admin/employees/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Employee not found"));
    }
}
