package com.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "project_requirements")
public class ProjectRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // e.g. "Backend Developer", "QA Engineer"
    @Column(nullable = false)
    private String roleName;

    // Comma-separated skills e.g. "Java,Spring Boot,PostgreSQL"
    @Column(nullable = false)
    private String requiredSkills;

    @Column(nullable = false)
    private Integer minExperienceYears;

    @Column(nullable = false)
    private Integer numberOfPeople;

    @Column
    private String assignedEmployeeIds; // comma-separated IDs of matched employees

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    public ProjectRequirement() {}

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

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
}