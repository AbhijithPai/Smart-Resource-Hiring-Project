package com.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetRequestResponse {
    private Long id;
    private String employeeCode;
    private String employeeName;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime resolvedAt;
}