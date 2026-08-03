package com.service.ServiceImpl;

import com.config.JwtUtil;
import com.dto.request.LoginRequest;
import com.dto.response.LoginResponse;
import com.entity.Employee;
import com.enums.Role;
import com.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthServiceImpl authService;
    private LoginRequest request;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(employeeRepository, passwordEncoder, jwtUtil);
        request = new LoginRequest();
        request.setEmail("admin@example.com");
        request.setPassword("admin123");
    }

    @Test
    void loginReturnsTokenForBcryptPassword() {
        Employee employee = employee("$2bcrypt", Role.ADMIN);
        when(employeeRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches(request.getPassword(), employee.getPasswordHash())).thenReturn(true);
        when(jwtUtil.generateToken(request.getEmail(), "ADMIN")).thenReturn("jwt-token");

        LoginResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("ADMIN", response.getRole());
        assertEquals(request.getEmail(), response.getEmail());
        verify(employeeRepository, never()).save(any());
    }



    @Test
    void loginRejectsUnknownEmail() {
        when(employeeRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        ResponseStatusException exception =
                assertThrows(ResponseStatusException.class, () -> authService.login(request));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
        verifyNoInteractions(jwtUtil, passwordEncoder);
    }

    @Test
    void loginRejectsIncorrectPassword() {
        Employee employee = employee("$2bcrypt", Role.ADMIN);
        when(employeeRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches(request.getPassword(), employee.getPasswordHash())).thenReturn(false);

        ResponseStatusException exception =
                assertThrows(ResponseStatusException.class, () -> authService.login(request));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
        verifyNoInteractions(jwtUtil);
    }

    private Employee employee(String password, Role role) {
        return Employee.builder()
                .id(1L)
                .employeeCode("EMP-001")
                .email(request.getEmail())
                .passwordHash(password)
                .role(role)
                .firstName("Admin")
                .lastName("User")
                .build();
    }
}
