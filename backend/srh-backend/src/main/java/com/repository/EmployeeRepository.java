package com.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.entity.Employee;
import com.enums.EmployeeStatus;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee,Long> {

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByEmployeeCode(String employeeCode);

     boolean existsByEmail(String email);

     boolean existsByEmployeeCode(String employeeCode);

    List<Employee> findByStatus(EmployeeStatus status);
}
