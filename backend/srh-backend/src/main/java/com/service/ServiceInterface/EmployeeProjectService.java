package com.service.ServiceInterface;

import com.dto.response.EmployeeProjectResponse;

import java.util.List;

public interface EmployeeProjectService {
    List<EmployeeProjectResponse> getMyProjects(String employeeEmail);
}