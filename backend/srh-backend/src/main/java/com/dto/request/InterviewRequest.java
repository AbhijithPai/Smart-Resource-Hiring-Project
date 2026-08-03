package com.dto.request;

import com.enums.InterviewRound;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Schema(description = "Request to schedule an interview for a shortlisted employee against a specific project requirement (role)")
public class InterviewRequest {

    @NotNull
    @Schema(description = "ID of the employee to interview")
    private Long employeeId;

    @NotNull
    @Schema(description = "ID of the project")
    private Long projectId;

    // NEW: which requirement (role slot) on the project this interview is for.
    // The employee must be present in that requirement's assignedEmployeeIds.
    @NotNull
    @Schema(description = "ID of the ProjectRequirement (role) the employee is being interviewed for")
    private Long requirementId;

    @NotNull
    @Schema(description = "Interview round", example = "L1")
    private InterviewRound round;

    @NotNull
    @Schema(description = "Scheduled date and time for the interview", example = "2026-07-10T10:00:00")
    private LocalDateTime scheduledAt;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getRequirementId() { return requirementId; }
    public void setRequirementId(Long requirementId) { this.requirementId = requirementId; }

    public InterviewRound getRound() { return round; }
    public void setRound(InterviewRound round) { this.round = round; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
}
