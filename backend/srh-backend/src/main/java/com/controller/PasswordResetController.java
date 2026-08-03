package com.controller;

import com.dto.request.ForgotPasswordRequest;
import com.dto.request.ResetPasswordRequest;
import com.dto.response.ForgotPasswordResponse;
import com.service.ServiceInterface.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/password-reset")
@Tag(name = "Password Reset", description = "Forgot password workflow for employees")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @Operation(summary = "Request password reset", description = "Submits a reset request for admin approval using email + employee code.")
    @PostMapping("/request")
    public ForgotPasswordResponse request(@Valid @RequestBody ForgotPasswordRequest request) {
        return passwordResetService.requestReset(request.getEmail(), request.getEmployeeCode());
    }

    @Operation(summary = "Check reset request status", description = "Checks whether the latest reset request for this email + employee code has been approved.")
    @PostMapping("/check")
    public ForgotPasswordResponse check(@Valid @RequestBody ForgotPasswordRequest request) {
        return passwordResetService.checkStatus(request.getEmail(), request.getEmployeeCode());
    }

    @Operation(summary = "Reset password", description = "Sets a new password once the request has been approved by admin.")
    @PostMapping("/reset")
    public ResponseEntity<Void> reset(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }
}
