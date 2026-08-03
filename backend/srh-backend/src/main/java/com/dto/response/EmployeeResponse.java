package com.dto.response;

import com.entity.Certification;
import com.entity.ProjectHistory;
import com.entity.SkillEntry;
import com.enums.EmployeeStatus;
import com.enums.Role;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Employee details returned by the API. Passwords are never returned.")
public class EmployeeResponse {
    private Long id;

    private String employeeCode;

    @Schema(example = "aarav.sharma@example.com")
    private String email;
    private Role role;

    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String department;
    private String designation;
    private String location;
    private LocalDate joiningDate;
    private EmployeeStatus status;
    private LocalDate benchStartDate;
    private LocalDate allocationDate;
    private Long managerId;
    private BigDecimal experienceYears;
    private Boolean firstLogin;
    private Boolean active;
    private List<SkillEntry> skills;
    private List<Certification> certifications;
    private List<ProjectHistory> projectHistory;
    private List<EmployeeProjectAssignmentResponse> projectAssignments;

    public EmployeeResponse(Long id, String employeeCode, String email, Role role, String firstName, String lastName,
                            String phoneNumber, String department, String designation, String location,
                            LocalDate joiningDate, EmployeeStatus status, LocalDate benchStartDate,
                            LocalDate allocationDate, Long managerId, BigDecimal experienceYears,
                            Boolean firstLogin, Boolean active,
                            List<SkillEntry> skills, List<Certification> certifications,
                            List<ProjectHistory> projectHistory,
                            List<EmployeeProjectAssignmentResponse> projectAssignments) {
        this.id = id;
        this.employeeCode = employeeCode;
        this.email = email;
        this.role = role;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.department = department;
        this.designation = designation;
        this.location = location;
        this.joiningDate = joiningDate;
        this.status = status;
        this.benchStartDate = benchStartDate;
        this.allocationDate = allocationDate;
        this.managerId = managerId;
        this.experienceYears = experienceYears;
        this.firstLogin = firstLogin;
        this.active = active;
        this.skills = skills;
        this.certifications = certifications;
        this.projectHistory = projectHistory;
        this.projectAssignments = projectAssignments;
    }


    public Long getId() { return id; }

    public String getEmployeeCode() { return employeeCode; }

    public String getEmail() { return email; }

    public Role getRole() {
        return role;
    }

    public String getFirstName() { return firstName; }

    public String getLastName() { return lastName; }

    public String getPhoneNumber() { return phoneNumber; }

    public String getDepartment() { return department; }

    public String getDesignation() { return designation; }

    public String getLocation() { return location; }

    public LocalDate getJoiningDate() { return joiningDate; }

    public EmployeeStatus getStatus() { return status; }

    public LocalDate getBenchStartDate() { return benchStartDate; }

    public LocalDate getAllocationDate() { return allocationDate; }

    public Long getManagerId() { return managerId; }

    public BigDecimal getExperienceYears() { return experienceYears; }

    public Boolean getFirstLogin() { return firstLogin; }

    public Boolean getActive() { return active; }

    public List<SkillEntry> getSkills() { return skills; }

    public List<Certification> getCertifications() { return certifications; }

    public List<ProjectHistory> getProjectHistory() { return projectHistory; }

    public List<EmployeeProjectAssignmentResponse> getProjectAssignments() { return projectAssignments; }
}
