package com.dto.response;

public class EmployeeProjectResponse {

    private Long projectId;
    private String projectName;
    private String description;      // job description (Project.description)
    private String clientName;       // resolved from the client's Employee record, falls back to email
    private String clientEmail;
    private String roleName;         // which requirement/role they were shortlisted for
    private String employeeStatus;   // SHORTLISTED or ALLOCATED

    public EmployeeProjectResponse(Long projectId, String projectName, String description, String clientName,
                                   String clientEmail, String roleName, String employeeStatus) {
        this.projectId = projectId;
        this.projectName = projectName;
        this.description = description;
        this.clientName = clientName;
        this.clientEmail = clientEmail;
        this.roleName = roleName;
        this.employeeStatus = employeeStatus;
    }

    public Long getProjectId() { return projectId; }
    public String getProjectName() { return projectName; }
    public String getDescription() { return description; }
    public String getClientName() { return clientName; }
    public String getClientEmail() { return clientEmail; }
    public String getRoleName() { return roleName; }
    public String getEmployeeStatus() { return employeeStatus; }
}