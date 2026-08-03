package com.controller;

import com.dto.request.EmployeeUpdateRequest;
import com.enums.Role;
import com.service.ServiceInterface.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmployeeControllerTest extends ControllerTestSupport {

    private MockMvc mockMvc;

    @Mock
    private EmployeeService employeeService;
    @Mock
    private com.service.ServiceInterface.EmployeeProjectService employeeProjectService;

    @BeforeEach
    void setUp() {
        mockMvc = mockMvcFor(new EmployeeController(employeeService, employeeProjectService));
    }

    @Test
    void viewOwnProfileReturnsAuthenticatedEmployee() throws Exception {
        when(employeeService.getEmployeeByEmail("employee@example.com"))
                .thenReturn(employeeResponse(3L, "EMP-1003", "employee@example.com", Role.EMPLOYEE));

        mockMvc.perform(get("/api/employees/me")
                        .principal(new TestingAuthenticationToken("employee@example.com", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.email").value("employee@example.com"));

        verify(employeeService).getEmployeeByEmail("employee@example.com");
    }

    @Test
    void updateOwnProfileReturnsUpdatedProfile() throws Exception {
        EmployeeUpdateRequest request = employeeUpdateRequest();
        when(employeeService.updateOwnProfile(eq("employee@example.com"), any(EmployeeUpdateRequest.class)))
                .thenReturn(employeeResponse(3L, "EMP-1003", "employee@example.com", Role.EMPLOYEE));

        mockMvc.perform(put("/api/employees/me")
                        .principal(new TestingAuthenticationToken("employee@example.com", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeCode").value("EMP-1003"))
                .andExpect(jsonPath("$.email").value("employee@example.com"));

        verify(employeeService).updateOwnProfile(eq("employee@example.com"), any(EmployeeUpdateRequest.class));
    }

    @Test
    void updateOwnProfileRejectsInvalidEmail() throws Exception {
        EmployeeUpdateRequest request = new EmployeeUpdateRequest();
        request.setEmail("bad-email");

        mockMvc.perform(put("/api/employees/me")
                        .principal(new TestingAuthenticationToken("employee@example.com", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/employees/me"));

        verifyNoInteractions(employeeService);
    }
}
