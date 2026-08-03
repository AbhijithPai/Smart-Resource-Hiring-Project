package com.config;

import com.entity.Employee;
import com.enums.Role;
import com.repository.EmployeeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedAdmin(EmployeeRepository employeeRepository,
                                       PasswordEncoder passwordEncoder,
                                       JdbcTemplate jdbcTemplate) {
        return args -> {
            ensureRoleConstraintSupportsProjectAdministrator(jdbcTemplate);
            seedUser(employeeRepository, passwordEncoder, "ADMIN-001", "admin@example.com", "admin123",
                    Role.ADMIN, "Admin", "User", "Administration", "System Administrator");
            seedUser(employeeRepository, passwordEncoder, "CLIENT-001", "client@example.com", "client123",
                    Role.CLIENT, "Client", "User", "Interview Services", "Client Coordinator");
            seedUser(employeeRepository, passwordEncoder, "PADMIN-001", "project.admin@example.com", "project123",
                    Role.PROJECT_ADMINISTRATOR, "Project", "Administrator", "Delivery", "Project Administrator");
        };
    }

    private void ensureRoleConstraintSupportsProjectAdministrator(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("UPDATE employees SET role = 'EMPLOYEE' WHERE role = 'OPERATOR'");
        jdbcTemplate.execute("ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check");
        jdbcTemplate.execute("""
                ALTER TABLE employees
                ADD CONSTRAINT employees_role_check
                CHECK (role IN ('ADMIN', 'EMPLOYEE', 'CLIENT', 'PROJECT_ADMIN', 'PROJECT_ADMINISTRATOR'))
                """);
    }

    private void seedUser(EmployeeRepository employeeRepository,
                          PasswordEncoder passwordEncoder,
                          String employeeCode,
                          String email,
                          String password,
                          Role role,
                          String firstName,
                          String lastName,
                          String department,
                          String designation) {
        employeeRepository.findByEmail(email).orElseGet(() -> {
            Employee employee = new Employee();
            employee.setEmployeeCode(employeeCode);
            employee.setEmail(email);
            employee.setPasswordHash(passwordEncoder.encode(password));
            employee.setRole(role);
            employee.setFirstName(firstName);
            employee.setLastName(lastName);
            employee.setDepartment(department);
            employee.setDesignation(designation);
            employee.setLocation("Bangalore");
            employee.setActive(true);
            employee.setFirstLogin(false);
            return employeeRepository.save(employee);
        });
    }
}
