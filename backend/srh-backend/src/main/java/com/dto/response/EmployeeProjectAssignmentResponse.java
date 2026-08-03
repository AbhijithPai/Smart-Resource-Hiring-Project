package com.dto.response;

public class EmployeeProjectAssignmentResponse {

    private Long projectId;
    private String projectName;
    private String projectDescription;
    private String clientName;
    private String clientEmail;
    private String roleName;

    public EmployeeProjectAssignmentResponse(Long projectId, String projectName, String projectDescription,
                                             String clientName, String clientEmail, String roleName) {
        this.projectId = projectId;
        this.projectName = projectName;
        this.projectDescription = projectDescription;
        this.clientName = clientName;
        this.clientEmail = clientEmail;
        this.roleName = roleName;
    }

    public Long getProjectId() { return projectId; }

    public String getProjectName() { return projectName; }

    public String getProjectDescription() { return projectDescription; }

    public String getClientName() { return clientName; }

    public String getClientEmail() { return clientEmail; }

    public String getRoleName() { return roleName; }
}
