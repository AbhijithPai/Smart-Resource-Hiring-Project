package com.controller;

import com.dto.request.EmployeeRequest;
import com.dto.request.EmployeeUpdateRequest;
import com.dto.response.EmployeeResponse;
import com.enums.EmployeeStatus;
import com.enums.Role;
import com.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.LocalDate;
import java.util.List;

abstract class ControllerTestSupport {

    protected final ObjectMapper objectMapper = new ObjectMapper();

    protected MockMvc mockMvcFor(Object controller) {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        return MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    protected EmployeeRequest employeeRequest() {
        EmployeeRequest request = new EmployeeRequest();
        request.setEmployeeCode("EMP-1001");
        request.setEmail("aarav.sharma@example.com");
        request.setPassword("employee123");
        request.setRole(Role.EMPLOYEE);
        request.setFirstName("Aarav");
        request.setLastName("Sharma");
        request.setDepartment("Engineering");
        request.setDesignation("Developer");
        request.setLocation("Bengaluru");
        request.setStatus(EmployeeStatus.ON_BENCH);
        request.setActive(true);
        return request;
    }

    protected EmployeeUpdateRequest employeeUpdateRequest() {
        EmployeeUpdateRequest request = new EmployeeUpdateRequest();
        request.setEmail("updated@example.com");
        request.setFirstName("Aarav");
        request.setLastName("Sharma");
        request.setDepartment("Product Engineering");
        request.setActive(true);
        return request;
    }

    protected EmployeeResponse employeeResponse(Long id, String employeeCode, String email, Role role) {
        return new EmployeeResponse(
                id,
                employeeCode,
                email,
                role,
                "Aarav",
                "Sharma",
                "9876543210",
                "Engineering",
                "Developer",
                "Bengaluru",
                LocalDate.of(2026, 1, 15),
                EmployeeStatus.ON_BENCH,
                null,           // benchStartDate
                null,           // allocationDate
                null,           // managerId
                null,           // experienceYears
                Boolean.FALSE,  // firstLogin
                Boolean.TRUE,   // active
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
    }
}

