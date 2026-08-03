package com.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectHistory {

    private Long projectId;

    @Column(length = 150)
    private String projectName;

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(length = 100)
    private String roleInProject;
}
