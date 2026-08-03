package com.controller;

import com.dto.response.PasswordResetRequestResponse;
import com.service.ServiceInterface.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/password-reset-requests")
@Tag(name = "Admin Password Reset", description = "Admin approval/rejection of employee password reset requests")
public class AdminPasswordResetController {

    private final PasswordResetService passwordResetService;

    public AdminPasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @Operation(summary = "List reset requests", description = "Optionally filter by status=PENDING")
    @GetMapping
    public List<PasswordResetRequestResponse> getAll(@RequestParam(required = false) String status) {
        if ("PENDING".equalsIgnoreCase(status)) {
            return passwordResetService.getPendingRequests();
        }
        return passwordResetService.getAllRequests();
    }

    @Operation(summary = "Approve a reset request")
    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Long id) {
        passwordResetService.approve(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Reject a reset request")
    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable Long id) {
        passwordResetService.reject(id);
        return ResponseEntity.noContent().build();
    }
}