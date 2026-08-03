package com.service.ServiceInterface;

import com.dto.request.EmployeeRequest;
import com.dto.request.EmployeeUpdateRequest;
import com.dto.response.BulkImportResponse;
import com.dto.response.EmployeeResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EmployeeService {

    List<EmployeeResponse> getAllEmployees();

    EmployeeResponse getEmployeeById(Long id);

    EmployeeResponse getEmployeeByEmail(String email);

    EmployeeResponse saveEmployee(EmployeeRequest employeeRequest);

    EmployeeResponse updateEmployee(Long id, EmployeeUpdateRequest employeeRequest);

    EmployeeResponse updateOwnProfile(String email, EmployeeUpdateRequest employeeRequest);

    BulkImportResponse bulkImportEmployees(MultipartFile file);

    EmployeeResponse importEmployeeRow(EmployeeRequest employeeRequest);

    void deleteEmployee(Long id);
}
