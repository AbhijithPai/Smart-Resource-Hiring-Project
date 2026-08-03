package com.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private String createdBy;
    private String clientEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<ProjectRequirementResponse> requirements;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public List<ProjectRequirementResponse> getRequirements() { return requirements; }
    public void setRequirements(List<ProjectRequirementResponse> requirements) { this.requirements = requirements; }
}