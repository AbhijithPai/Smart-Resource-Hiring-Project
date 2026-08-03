package com.dto.response;

import com.enums.InterviewRound;
import com.enums.InterviewStatus;

import java.time.LocalDateTime;

public class InterviewResponse {
    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeFirstName;
    private String employeeLastName;
    private String employeeEmail;
    private Long projectId;
    private String projectName;

    // NEW
    private Long requirementId;
    private String roleName;

    private InterviewRound round;
    private LocalDateTime scheduledAt;
    private InterviewStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public InterviewResponse(Long id, Long employeeId, String employeeCode, String employeeFirstName,
                              String employeeLastName, String employeeEmail, Long projectId, String projectName,
                              Long requirementId, String roleName,
                              InterviewRound round, LocalDateTime scheduledAt, InterviewStatus status,
                              LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeCode = employeeCode;
        this.employeeFirstName = employeeFirstName;
        this.employeeLastName = employeeLastName;
        this.employeeEmail = employeeEmail;
        this.projectId = projectId;
        this.projectName = projectName;
        this.requirementId = requirementId;
        this.roleName = roleName;
        this.round = round;
        this.scheduledAt = scheduledAt;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public Long getEmployeeId() { return employeeId; }
    public String getEmployeeCode() { return employeeCode; }
    public String getEmployeeFirstName() { return employeeFirstName; }
    public String getEmployeeLastName() { return employeeLastName; }
    public String getEmployeeEmail() { return employeeEmail; }
    public Long getProjectId() { return projectId; }
    public String getProjectName() { return projectName; }
    public Long getRequirementId() { return requirementId; }
    public String getRoleName() { return roleName; }
    public InterviewRound getRound() { return round; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public InterviewStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
