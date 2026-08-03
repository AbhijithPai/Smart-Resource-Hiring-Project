// ─── EmployeeRequest.java (UPDATED) ───────────────────────────────────────────
// Replace your existing EmployeeRequest with this version

package com.dto.request;

import com.entity.Certification;
import com.entity.ProjectHistory;
import com.entity.SkillEntry;
import com.enums.EmployeeStatus;
import com.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Schema(description = "Employee creation payload. Only ADMIN users can create employees.")
public class EmployeeRequest {

    @NotBlank
    @Schema(example = "EMP-1001")
    private String employeeCode;

    @NotBlank
    @Email
    @Schema(example = "aarav.sharma@example.com")
    private String email;

    @NotBlank
    @Size(min = 6, max = 72)
    @Schema(example = "employee123")
    private String password;

    @NotNull
    @Schema(example = "EMPLOYEE")
    private Role role;

    @NotBlank
    @Schema(example = "Aarav")
    private String firstName;

    @NotBlank
    @Schema(example = "Sharma")
    private String lastName;

    private String phoneNumber;
    private String department;
    private String designation;
    private String location;
    private LocalDate joiningDate;
    private EmployeeStatus status;
    private LocalDate benchStartDate;
    private Long managerId;
    private BigDecimal experienceYears;
    private Boolean active;
    private List<SkillEntry> skills = new ArrayList<>();
    private List<Certification> certifications = new ArrayList<>();
    private List<ProjectHistory> projectHistory = new ArrayList<>();

    public String getEmployeeCode() { return employeeCode; }

    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }


    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getFirstName() { return firstName; }

    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }

    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneNumber() { return phoneNumber; }

    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getDepartment() { return department; }

    public void setDepartment(String department) { this.department = department; }

    public String getDesignation() { return designation; }

    public void setDesignation(String designation) { this.designation = designation; }

    public String getLocation() { return location; }

    public void setLocation(String location) { this.location = location; }

    public LocalDate getJoiningDate() { return joiningDate; }

    public void setJoiningDate(LocalDate joiningDate) { this.joiningDate = joiningDate; }

    public EmployeeStatus getStatus() { return status; }

    public void setStatus(EmployeeStatus status) { this.status = status; }

    public LocalDate getBenchStartDate() { return benchStartDate; }

    public void setBenchStartDate(LocalDate benchStartDate) { this.benchStartDate = benchStartDate; }

    public Long getManagerId() { return managerId; }

    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public BigDecimal getExperienceYears() { return experienceYears; }

    public void setExperienceYears(BigDecimal experienceYears) { this.experienceYears = experienceYears; }

    public Boolean getActive() { return active; }

    public void setActive(Boolean active) { this.active = active; }

    public List<SkillEntry> getSkills() { return skills; }

    public void setSkills(List<SkillEntry> skills) { this.skills = skills; }

    public List<Certification> getCertifications() { return certifications; }

    public void setCertifications(List<Certification> certifications) { this.certifications = certifications; }

    public List<ProjectHistory> getProjectHistory() { return projectHistory; }

    public void setProjectHistory(List<ProjectHistory> projectHistory) { this.projectHistory = projectHistory; }
}
