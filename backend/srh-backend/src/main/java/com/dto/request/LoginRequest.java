package com.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Login credentials")
public class LoginRequest {

    @NotBlank
    @Email
    @Schema(example = "admin@example.com", description = "Registered user email")
    private String email;

    @NotBlank
    @Schema(example = "admin123", description = "User password")
    private String password;

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }
}
