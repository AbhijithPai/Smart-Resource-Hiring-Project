package com.service.ServiceImpl;

import com.config.JwtUtil;
import com.dto.request.LoginRequest;
import com.dto.response.LoginResponse;
import com.entity.Employee;
import com.repository.EmployeeRepository;
import com.service.ServiceInterface.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthServiceImpl implements AuthService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        Employee employee = employeeRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), employee.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String role = employee.getRole().name();
        return new LoginResponse(
                jwtUtil.generateToken(employee.getEmail(), role),
                role,
                employee.getEmail(),
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName()
        );
    }
}
