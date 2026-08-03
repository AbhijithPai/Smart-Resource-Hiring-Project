package com.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.time.LocalDate;
import java.util.List;

public class ProjectRequest {
    @NotBlank
    private String name;
    private String description;
    private String clientEmail;
    @NotEmpty @Valid
    private List<ProjectRequirementRequest> requirements;

    // NEW: only read/required at creation time (see ProjectServiceImpl).
    // Deliberately not annotated with @NotNull so existing update calls
    // that don't send these fields keep working unchanged.
    private LocalDate startDate;
    private LocalDate endDate;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }
    public List<ProjectRequirementRequest> getRequirements() { return requirements; }
    public void setRequirements(List<ProjectRequirementRequest> requirements) { this.requirements = requirements; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}