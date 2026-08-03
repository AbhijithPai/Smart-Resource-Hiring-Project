package com.controller;

import com.dto.request.LoginRequest;
import com.dto.response.LoginResponse;
import com.service.ServiceInterface.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Login and logout APIs")
public class AuthController {

    public final AuthService authService;

    public AuthController(AuthService authService){
        this.authService = authService;

    }

    @Operation(summary = "Login", description = "Authenticates an active employee and returns a JWT access token.")
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest loginRequest){
        return authService.login(loginRequest);
    }

    @Operation(summary = "Logout", description = "Client-side logout endpoint. Discard the JWT token after this call.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
