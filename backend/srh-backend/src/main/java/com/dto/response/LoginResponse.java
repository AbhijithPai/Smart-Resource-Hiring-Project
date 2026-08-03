package com.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Authenticated session response")
public class LoginResponse {

    @Schema(description = "JWT access token", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String token;

    @Schema(example = "ADMIN")
    private String role;

    @Schema(example = "admin@example.com")
    private String email;

    @Schema(example = "1")
    private Long employeeId;

    @Schema(example = "Admin")
    private String firstName;

    @Schema(example = "User")
    private String lastName;

    public LoginResponse(String token, String role, String email, Long employeeId, String firstName, String lastName) {
        this.token = token;
        this.role = role;
        this.email = email;
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }

    public String getEmail() {
        return email;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }
}
