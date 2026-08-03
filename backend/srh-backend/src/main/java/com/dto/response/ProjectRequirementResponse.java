package com.dto.response;

import java.util.List;

public class ProjectRequirementResponse {
    private Long id;
    private String roleName;
    private String requiredSkills;
    private Integer minExperienceYears;
    private Integer numberOfPeople;
    private String assignedEmployeeIds;
    private List<EmployeeResponse> matchedEmployees;
    private Integer allocatedCount;
    // NEW: count of assignedEmployeeIds whose CURRENT employee status is
    // SHORTLISTED or ALLOCATED - i.e. still actively filling this slot
    // right now. Unlike assignedEmployeeIds.length (which never shrinks),
    // this correctly drops when someone fails an interview and reverts to
    // ON_BENCH. This is the number both the per-requirement and
    // project-wide "X filled" banners should read.
    private Integer activeShortlistedCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public String getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(String requiredSkills) { this.requiredSkills = requiredSkills; }
    public Integer getMinExperienceYears() { return minExperienceYears; }
    public void setMinExperienceYears(Integer minExperienceYears) { this.minExperienceYears = minExperienceYears; }
    public Integer getNumberOfPeople() { return numberOfPeople; }
    public void setNumberOfPeople(Integer numberOfPeople) { this.numberOfPeople = numberOfPeople; }
    public String getAssignedEmployeeIds() { return assignedEmployeeIds; }
    public void setAssignedEmployeeIds(String assignedEmployeeIds) { this.assignedEmployeeIds = assignedEmployeeIds; }
    public List<EmployeeResponse> getMatchedEmployees() { return matchedEmployees; }
    public void setMatchedEmployees(List<EmployeeResponse> matchedEmployees) { this.matchedEmployees = matchedEmployees; }
    public Integer getAllocatedCount() { return allocatedCount; }
    public void setAllocatedCount(Integer allocatedCount) { this.allocatedCount = allocatedCount; }
    public Integer getActiveShortlistedCount() { return activeShortlistedCount; }
    public void setActiveShortlistedCount(Integer activeShortlistedCount) { this.activeShortlistedCount = activeShortlistedCount; }
}