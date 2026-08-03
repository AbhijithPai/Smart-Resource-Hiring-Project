package com.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Schema(description = "Request to shortlist employees for a demand project")
public class ShortlistRequest {

    @NotEmpty
    @Schema(description = "List of employee IDs to shortlist", example = "[1, 2, 3]")
    private List<Long> employeeIds;

    public List<Long> getEmployeeIds() { return employeeIds; }

    public void setEmployeeIds(List<Long> employeeIds) { this.employeeIds = employeeIds; }
}
