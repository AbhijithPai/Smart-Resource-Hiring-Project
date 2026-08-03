package com.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Standard API error response")
public class ErrorResponse {

    @Schema(example = "2026-06-08T07:30:00Z")
    private Instant timestamp;

    @Schema(example = "401")
    private int status;

    @Schema(example = "Unauthorized")
    private String error;

    @Schema(example = "Invalid email or password")
    private String message;

    @Schema(example = "/api/auth/login")
    private String path;

    public ErrorResponse(Instant timestamp, int status, String error, String message, String path) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }
}
