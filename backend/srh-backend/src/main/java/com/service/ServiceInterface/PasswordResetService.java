package com.service.ServiceInterface;

import com.dto.request.ResetPasswordRequest;
import com.dto.response.ForgotPasswordResponse;
import com.dto.response.PasswordResetRequestResponse;

import java.util.List;

public interface PasswordResetService {
    ForgotPasswordResponse requestReset(String email, String employeeCode);
    ForgotPasswordResponse checkStatus(String email, String employeeCode);
    void resetPassword(ResetPasswordRequest request);
    List<PasswordResetRequestResponse> getAllRequests();
    List<PasswordResetRequestResponse> getPendingRequests();
    void approve(Long id);
    void reject(Long id);
}