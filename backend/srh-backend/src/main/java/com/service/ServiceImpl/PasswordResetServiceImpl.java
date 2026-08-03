package com.service.ServiceImpl;

import com.dto.request.ResetPasswordRequest;
import com.dto.response.ForgotPasswordResponse;
import com.dto.response.PasswordResetRequestResponse;
import com.entity.Employee;
import com.entity.PasswordResetRequest;
import com.enums.PasswordResetStatus;
import com.repository.EmployeeRepository;
import com.repository.PasswordResetRequestRepository;
import com.service.ServiceInterface.PasswordResetService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private final EmployeeRepository employeeRepository;
    private final PasswordResetRequestRepository resetRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetServiceImpl(EmployeeRepository employeeRepository,
                                    PasswordResetRequestRepository resetRepository,
                                    PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.resetRepository = resetRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private Employee validateEmployee(String email, String employeeCode) {
        Employee employee = employeeRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee found with this code"));

        if (!employee.getEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email does not match this employee code");
        }

        return employee;
    }

    @Override
    public ForgotPasswordResponse requestReset(String email, String employeeCode) {
        Employee employee = validateEmployee(email, employeeCode);

        Optional<PasswordResetRequest> existing =
                resetRepository.findTopByEmployeeCodeOrderByRequestedAtDesc(employeeCode);

        if (existing.isPresent()) {
            PasswordResetStatus currentStatus = existing.get().getStatus();

            if (currentStatus == PasswordResetStatus.PENDING) {
                return new ForgotPasswordResponse("PENDING", "Your request is already pending admin approval.");
            }

            if (currentStatus == PasswordResetStatus.APPROVED) {
                return new ForgotPasswordResponse("APPROVED", "Your request is approved. Click 'Update Password' to set a new password.");
            }
            // REJECTED or COMPLETED -> fall through and allow a fresh request below.
        }

        PasswordResetRequest request = PasswordResetRequest.builder()
                .employeeCode(employeeCode)
                .employeeId(employee.getId())
                .status(PasswordResetStatus.PENDING)
                .requestedAt(LocalDateTime.now())
                .build();

        resetRepository.save(request);
        return new ForgotPasswordResponse("PENDING", "Request sent to admin for approval.");
    }

    @Override
    public ForgotPasswordResponse checkStatus(String email, String employeeCode) {
        validateEmployee(email, employeeCode);

        PasswordResetRequest request = resetRepository.findTopByEmployeeCodeOrderByRequestedAtDesc(employeeCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No reset request found. Please submit a request first."));

        return switch (request.getStatus()) {
            case PENDING -> new ForgotPasswordResponse("PENDING", "Your request is still pending approval from the admin.");
            case APPROVED -> new ForgotPasswordResponse("APPROVED", "Your request is approved. You can set a new password now.");
            case REJECTED -> new ForgotPasswordResponse("REJECTED", "Your request is still pending approval from the admin.");
            case COMPLETED -> new ForgotPasswordResponse("COMPLETED", "Password already reset. Please submit a new request if needed.");
        };
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        Employee employee = validateEmployee(request.getEmail(), request.getEmployeeCode());

        PasswordResetRequest resetRequest = resetRepository
                .findTopByEmployeeCodeOrderByRequestedAtDesc(request.getEmployeeCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No reset request found"));

        if (resetRequest.getStatus() != PasswordResetStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your request has not been approved by admin yet");
        }

        employee.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        employeeRepository.save(employee);

        resetRequest.setStatus(PasswordResetStatus.COMPLETED);
        resetRequest.setResolvedAt(LocalDateTime.now());
        resetRepository.save(resetRequest);
    }

    @Override
    public List<PasswordResetRequestResponse> getAllRequests() {
        return resetRepository.findAllByOrderByRequestedAtDesc().stream().map(this::toResponse).toList();
    }

    @Override
    public List<PasswordResetRequestResponse> getPendingRequests() {
        return resetRepository.findByStatusOrderByRequestedAtDesc(PasswordResetStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void approve(Long id) {
        PasswordResetRequest request = resetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        request.setStatus(PasswordResetStatus.APPROVED);
        request.setResolvedAt(LocalDateTime.now());
        resetRepository.save(request);
    }

    @Override
    @Transactional
    public void reject(Long id) {
        PasswordResetRequest request = resetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        request.setStatus(PasswordResetStatus.REJECTED);
        request.setResolvedAt(LocalDateTime.now());
        resetRepository.save(request);
    }

    private PasswordResetRequestResponse toResponse(PasswordResetRequest request) {
        String name = employeeRepository.findById(request.getEmployeeId())
                .map(e -> e.getFirstName() + " " + e.getLastName())
                .orElse("Unknown");

        return new PasswordResetRequestResponse(
                request.getId(),
                request.getEmployeeCode(),
                name,
                request.getStatus().name(),
                request.getRequestedAt(),
                request.getResolvedAt()
        );
    }
}
