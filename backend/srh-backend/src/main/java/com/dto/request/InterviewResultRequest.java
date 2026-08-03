package com.dto.request;

import com.enums.InterviewStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request to record the result of an interview round")
public class InterviewResultRequest {

    @NotNull
    @Schema(description = "Result of the interview round", example = "PASSED")
    private InterviewStatus status;

    public InterviewStatus getStatus() { return status; }
    public void setStatus(InterviewStatus status) { this.status = status; }
}
