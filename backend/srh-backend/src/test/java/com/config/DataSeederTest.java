package com.config;

import com.entity.Employee;
import com.enums.Role;
import com.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.Mockito.*;

class DataSeederTest {

    @Test
    void createsDefaultAdminWhenMissing() throws Exception {
        EmployeeRepository repository = mock(EmployeeRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JdbcTemplate template = mock(JdbcTemplate.class);
        when(repository.findByEmail("admin@example.com")).thenReturn(Optional.empty());
        when(encoder.encode("admin123")).thenReturn("$2encoded");
        when(repository.findByEmail("client@example.com")).thenReturn(Optional.empty());
        when(repository.findByEmail("project.admin@example.com")).thenReturn(Optional.empty());
        when(encoder.encode(anyString())).thenReturn("$2encoded");

        CommandLineRunner runner = new DataSeeder().seedAdmin(repository, encoder, template);
        runner.run();

        @SuppressWarnings("unchecked")
        var captor = forClass(Employee.class);
        verify(repository, times(3)).save(captor.capture());

        List<Employee> savedEmployees = captor.getAllValues();
        assertTrue(savedEmployees.stream().anyMatch(employee ->
                "admin@example.com".equals(employee.getEmail())
                        && "Admin".equals(employee.getFirstName())
                        && "User".equals(employee.getLastName())
                        && "$2encoded".equals(employee.getPasswordHash())
                        && employee.getRole() == Role.ADMIN));
        assertTrue(savedEmployees.stream().anyMatch(employee ->
                "client@example.com".equals(employee.getEmail())
                        && employee.getRole() == Role.CLIENT));
        assertTrue(savedEmployees.stream().anyMatch(employee ->
                "project.admin@example.com".equals(employee.getEmail())
                        && employee.getRole() == Role.PROJECT_ADMINISTRATOR));
    }

    @Test
    void leavesExistingAdminUntouched() throws Exception {
        EmployeeRepository repository = mock(EmployeeRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JdbcTemplate template = mock(JdbcTemplate.class);
        when(repository.findByEmail("admin@example.com")).thenReturn(Optional.of(new Employee()));
        when(repository.findByEmail("client@example.com")).thenReturn(Optional.of(new Employee()));
        when(repository.findByEmail("project.admin@example.com")).thenReturn(Optional.of(new Employee()));

        new DataSeeder().seedAdmin(repository, encoder, template).run();

        verify(repository, never()).save(any());
        verifyNoInteractions(encoder);
    }
}
