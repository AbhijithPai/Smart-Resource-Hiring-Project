package com.service.ServiceImpl;

import com.dto.request.EmployeeRequest;
import com.dto.request.EmployeeUpdateRequest;
import com.dto.response.EmployeeResponse;
import com.entity.Employee;
import com.entity.SkillEntry;
import com.enums.EmployeeStatus;
import com.enums.Role;
import com.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private com.repository.ProjectRepository projectRepository;
    @Mock
    private com.repository.InterviewRepository interviewRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private com.scheduler.ProjectExpiryScheduler projectExpiryScheduler;

    private EmployeeServiceImpl employeeService;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeServiceImpl(
                employeeRepository,
                projectRepository,
                interviewRepository,
                passwordEncoder,
                employeeService,
                projectExpiryScheduler);
    }

    // ─── saveEmployee ─────────────────────────────────────────────────────────

    @Test
    void saveEmployeeEncodesPasswordAndPersistsEmployee() {
        EmployeeRequest request = minimalRequest("EMP-001", "john@example.com", "secret");
        when(employeeRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode("EMP-001")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("$2encoded");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });

        EmployeeResponse response = employeeService.saveEmployee(request);

        assertEquals("EMP-001", response.getEmployeeCode());
        assertEquals("john@example.com", response.getEmail());
        verify(passwordEncoder).encode("secret");
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    void saveEmployeeDefaultsStatusToOnBenchWhenNull() {
        EmployeeRequest request = minimalRequest("EMP-002", "jane@example.com", "pass123");
        request.setStatus(null);

        when(employeeRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("$2hashed");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(2L);
            return e;
        });

        EmployeeResponse response = employeeService.saveEmployee(request);

        assertEquals(EmployeeStatus.ON_BENCH, response.getStatus());
    }

    @Test
    void saveEmployeeDefaultsActiveTrueWhenNull() {
        EmployeeRequest request = minimalRequest("EMP-003", "a@example.com", "pass123");
        request.setActive(null);

        when(employeeRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("$2hashed");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(3L);
            return e;
        });

        EmployeeResponse response = employeeService.saveEmployee(request);

        assertTrue(response.getActive());
    }

    @Test
    void saveEmployeeThrowsConflictOnDuplicateEmail() {
        EmployeeRequest request = minimalRequest("EMP-004", "dup@example.com", "pass123");
        Employee existing = employee(10L, "EMP-999", "dup@example.com");
        when(employeeRepository.findByEmail("dup@example.com")).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.saveEmployee(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void saveEmployeeThrowsConflictOnDuplicateEmployeeCode() {
        EmployeeRequest request = minimalRequest("EMP-DUP", "new@example.com", "pass123");
        Employee existing = employee(11L, "EMP-DUP", "other@example.com");
        when(employeeRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode("EMP-DUP")).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.saveEmployee(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(employeeRepository, never()).save(any());
    }

    // ─── getAllEmployees ───────────────────────────────────────────────────────

    @Test
    void getAllEmployeesReturnsMappedResponses() {
        when(employeeRepository.findAll()).thenReturn(List.of(
                employee(1L, "EMP-001", "a@example.com"),
                employee(2L, "EMP-002", "b@example.com")
        ));

        List<EmployeeResponse> responses = employeeService.getAllEmployees();

        assertEquals(2, responses.size());
        assertEquals("EMP-001", responses.get(0).getEmployeeCode());
        assertEquals("EMP-002", responses.get(1).getEmployeeCode());
    }

    @Test
    void getAllEmployeesReturnsEmptyListWhenNoneExist() {
        when(employeeRepository.findAll()).thenReturn(List.of());
        assertTrue(employeeService.getAllEmployees().isEmpty());
    }

    // ─── getEmployeeById ──────────────────────────────────────────────────────

    @Test
    void getEmployeeByIdReturnsResponseWhenFound() {
        Employee emp = employee(5L, "EMP-005", "five@example.com");
        when(employeeRepository.findById(5L)).thenReturn(Optional.of(emp));

        EmployeeResponse response = employeeService.getEmployeeById(5L);

        assertEquals(5L, response.getId());
        assertEquals("EMP-005", response.getEmployeeCode());
    }

    @Test
    void getEmployeeByIdThrowsNotFoundWhenMissing() {
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.getEmployeeById(99L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ─── getEmployeeByEmail ───────────────────────────────────────────────────

    @Test
    void getEmployeeByEmailReturnsResponseWhenFound() {
        Employee emp = employee(6L, "EMP-006", "six@example.com");
        when(employeeRepository.findByEmail("six@example.com")).thenReturn(Optional.of(emp));

        EmployeeResponse response = employeeService.getEmployeeByEmail("six@example.com");

        assertEquals("six@example.com", response.getEmail());
    }

    @Test
    void getEmployeeByEmailThrowsNotFoundWhenMissing() {
        when(employeeRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.getEmployeeByEmail("ghost@example.com"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ─── updateEmployee (admin) ───────────────────────────────────────────────

    @Test
    void updateEmployeeAppliesAllProvidedFields() {
        Employee existing = employee(3L, "EMP-003", "old@example.com");

        EmployeeUpdateRequest update = new EmployeeUpdateRequest();
        update.setFirstName("Updated");
        update.setLastName("Person");
        update.setEmail("new@example.com");
        update.setRole(Role.ADMIN);
        update.setDepartment("HR");
        update.setDesignation("Manager");
        update.setLocation("Delhi");
        update.setStatus(EmployeeStatus.ALLOCATED);
        update.setExperienceYears(new BigDecimal("5.0"));
        update.setActive(false);

        when(employeeRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(employeeRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.save(existing)).thenReturn(existing);

        EmployeeResponse response = employeeService.updateEmployee(3L, update);

        assertEquals("Updated", response.getFirstName());
        assertEquals(Role.ADMIN, response.getRole());
        assertEquals("HR", response.getDepartment());
        assertEquals(EmployeeStatus.ALLOCATED, response.getStatus());
        assertFalse(response.getActive());
    }

    @Test
    void updateEmployeeEncodesNewPasswordWhenProvided() {
        Employee existing = employee(4L, "EMP-004", "emp@example.com");
        existing.setPasswordHash("$2old");

        EmployeeUpdateRequest update = new EmployeeUpdateRequest();
        update.setPassword("newSecret");

        when(employeeRepository.findById(4L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.encode("newSecret")).thenReturn("$2new");
        when(employeeRepository.save(existing)).thenReturn(existing);

        employeeService.updateEmployee(4L, update);

        assertEquals("$2new", existing.getPasswordHash());
        verify(passwordEncoder).encode("newSecret");
    }

    @Test
    void updateEmployeeKeepsExistingPasswordWhenBlankProvided() {
        Employee existing = employee(5L, "EMP-005", "emp2@example.com");
        existing.setPasswordHash("$2existing");

        EmployeeUpdateRequest update = new EmployeeUpdateRequest();
        update.setPassword("   ");

        when(employeeRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(employeeRepository.save(existing)).thenReturn(existing);

        employeeService.updateEmployee(5L, update);

        assertEquals("$2existing", existing.getPasswordHash());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void updateEmployeeThrowsConflictWhenNewEmailAlreadyTaken() {
        Employee existing = employee(6L, "EMP-006", "mine@example.com");
        Employee other = employee(99L, "EMP-099", "taken@example.com");

        EmployeeUpdateRequest update = new EmployeeUpdateRequest();
        update.setEmail("taken@example.com");

        when(employeeRepository.findById(6L)).thenReturn(Optional.of(existing));
        when(employeeRepository.findByEmail("taken@example.com")).thenReturn(Optional.of(other));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.updateEmployee(6L, update));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void updateEmployeeThrowsNotFoundWhenMissing() {
        when(employeeRepository.findById(77L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.updateEmployee(77L, new EmployeeUpdateRequest()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ─── updateOwnProfile ─────────────────────────────────────────────────────

    @Test
    void updateOwnProfileUpdatesOnlyAllowedFields() {
        Employee existing = employee(7L, "EMP-007", "self@example.com");
        existing.setPhoneNumber("1111111111");
        existing.setLocation("Old City");

        EmployeeUpdateRequest update = new EmployeeUpdateRequest();
        update.setPhoneNumber("9999999999");
        update.setLocation("New City");
        update.setExperienceYears(new BigDecimal("3.5"));
        update.setSkills(List.of(SkillEntry.builder().skillName("Java").build()));

        when(employeeRepository.findByEmail("self@example.com")).thenReturn(Optional.of(existing));
        when(employeeRepository.save(existing)).thenReturn(existing);

        EmployeeResponse response = employeeService.updateOwnProfile("self@example.com", update);

        assertEquals("9999999999", response.getPhoneNumber());
        assertEquals("New City", response.getLocation());
        assertEquals(new BigDecimal("3.5"), response.getExperienceYears());
    }

    @Test
    void updateOwnProfileIgnoresNullFields() {
        Employee existing = employee(8L, "EMP-008", "keep@example.com");
        existing.setPhoneNumber("1234567890");
        existing.setLocation("Pune");

        EmployeeUpdateRequest update = new EmployeeUpdateRequest(); // all null

        when(employeeRepository.findByEmail("keep@example.com")).thenReturn(Optional.of(existing));
        when(employeeRepository.save(existing)).thenReturn(existing);

        EmployeeResponse response = employeeService.updateOwnProfile("keep@example.com", update);

        assertEquals("1234567890", response.getPhoneNumber());
        assertEquals("Pune", response.getLocation());
    }

    @Test
    void updateOwnProfileThrowsNotFoundWhenEmailMissing() {
        when(employeeRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.updateOwnProfile("nobody@example.com", new EmployeeUpdateRequest()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ─── deleteEmployee ───────────────────────────────────────────────────────

    @Test
    void deleteEmployeeLoadsThenDeletesEmployee() {
        Employee emp = employee(9L, "EMP-009", "del@example.com");
        when(employeeRepository.findById(9L)).thenReturn(Optional.of(emp));

        employeeService.deleteEmployee(9L);

        verify(employeeRepository).delete(emp);
    }

    @Test
    void deleteEmployeeThrowsNotFoundWhenMissing() {
        when(employeeRepository.findById(88L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.deleteEmployee(88L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(employeeRepository, never()).delete(any());
    }

    // ─── bulkImportEmployees ──────────────────────────────────────────────────

    @Test
    void bulkImportThrowsBadRequestWhenFileIsEmpty() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", new byte[0]);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.bulkImportEmployees(emptyFile));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void bulkImportThrowsBadRequestWhenFileIsNull() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> employeeService.bulkImportEmployees(null));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void bulkImportCsvImportsValidRowsAndSkipsInvalidOnes() {
        String csv = "employeeCode,email,password,role,firstName,lastName\n" +
                     "EMP-101,valid@example.com,pass123,EMPLOYEE,Alice,Smith\n" +
                     "EMP-102,,pass123,EMPLOYEE,Bob,Jones\n"; // missing email — should fail

        MockMultipartFile file = new MockMultipartFile("file", "employees.csv",
                "text/csv", csv.getBytes());

        when(employeeRepository.findByEmail("valid@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode("EMP-101")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("$2hashed");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(100L);
            return e;
        });

        var result = employeeService.bulkImportEmployees(file);

        assertEquals(1, result.getImportedCount());
        assertEquals(1, result.getSkippedCount());
        assertFalse(result.getErrors().isEmpty());
    }

    @Test
    void bulkImportCsvUsesDefaultPasswordWhenPasswordColumnBlank() {
        String csv = "employeeCode,email,password,role,firstName,lastName\n" +
                     "EMP-200,nopass@example.com,,EMPLOYEE,Test,User\n";

        MockMultipartFile file = new MockMultipartFile("file", "employees.csv",
                "text/csv", csv.getBytes());

        when(employeeRepository.findByEmail("nopass@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode("EMP-200")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("employee123")).thenReturn("$2default");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(200L);
            return e;
        });

        var result = employeeService.bulkImportEmployees(file);

        assertEquals(1, result.getImportedCount());
        assertEquals(0, result.getSkippedCount());
        verify(passwordEncoder).encode("employee123");
    }

    @Test
    void bulkImportCsvAcceptsSlashSeparatedDates() {
        String csv = "employeeCode,email,password,role,firstName,lastName,joiningDate,benchStartDate\n" +
                     "EMP-300,date@example.com,pass123,EMPLOYEE,Date,Tester,01/31/2021,08/10/2020\n";

        MockMultipartFile file = new MockMultipartFile("file", "employees.csv",
                "text/csv", csv.getBytes());

        when(employeeRepository.findByEmail("date@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode("EMP-300")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass123")).thenReturn("$2hashed");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(300L);
            return e;
        });

        var result = employeeService.bulkImportEmployees(file);

        assertEquals(1, result.getImportedCount());
        assertEquals(0, result.getSkippedCount());

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        assertEquals(LocalDate.of(2021, 1, 31), employeeCaptor.getValue().getJoiningDate());
        assertEquals(LocalDate.of(2020, 8, 10), employeeCaptor.getValue().getBenchStartDate());
    }

    @Test
    void bulkImportCsvKeepsCommaSeparatedSkillsInOneColumn() {
        String csv = "employeeCode,email,password,role,firstName,lastName,department,designation,joiningDate,location,managerId,phoneNumber,status,skills,experienceYears\n" +
                     "EMP-400,skills@example.com,pass123,EMPLOYEE,Skill,Holder,Engineering,Developer,01/31/2021,Bangalore,10,9876543210,ON_BENCH,\"Java, Spring Boot, React\",3.5\n";

        MockMultipartFile file = new MockMultipartFile("file", "employees.csv",
                "text/csv", csv.getBytes());

        when(employeeRepository.findByEmail("skills@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode("EMP-400")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass123")).thenReturn("$2hashed");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(400L);
            return e;
        });

        var result = employeeService.bulkImportEmployees(file);

        assertEquals(1, result.getImportedCount());
        assertEquals(0, result.getSkippedCount());

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        assertEquals(3, employeeCaptor.getValue().getSkills().size());
        assertEquals("Java", employeeCaptor.getValue().getSkills().get(0).getSkillName());
        assertEquals("React", employeeCaptor.getValue().getSkills().get(2).getSkillName());
    }

    @Test
    void bulkImportCsvReadsStructuredSkillMetadataColumns() {
        String csv = "employeeCode,email,password,role,firstName,lastName,skillName1,selfRating1,skillDate1,skillName2,selfRating2,skillDate2\n" +
                     "EMP-500,meta@example.com,pass123,EMPLOYEE,Meta,User,Java,5,01/31/2021,React,4,08/10/2020\n";

        MockMultipartFile file = new MockMultipartFile("file", "employees.csv",
                "text/csv", csv.getBytes());

        when(employeeRepository.findByEmail("meta@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode("EMP-500")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass123")).thenReturn("$2hashed");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(500L);
            return e;
        });

        var result = employeeService.bulkImportEmployees(file);

        assertEquals(1, result.getImportedCount());
        assertEquals(0, result.getSkippedCount());

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        assertEquals(2, employeeCaptor.getValue().getSkills().size());
        assertEquals("Java", employeeCaptor.getValue().getSkills().get(0).getSkillName());
        assertEquals(Integer.valueOf(5), employeeCaptor.getValue().getSkills().get(0).getSelfRating());
        assertEquals(LocalDate.of(2021, 1, 31), employeeCaptor.getValue().getSkills().get(0).getSkillDate());
        assertEquals("React", employeeCaptor.getValue().getSkills().get(1).getSkillName());
        assertEquals(Integer.valueOf(4), employeeCaptor.getValue().getSkills().get(1).getSelfRating());
    }

    @Test
    void bulkImportExcelReadsTemplateSkillColumns() throws Exception {
        byte[] workbookBytes;
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Employees");
            var headers = sheet.createRow(0);
            String[] values = {
                    "role", "employeeCode", "firstName", "lastName", "email", "joiningDate",
                    "skill1Name", "skill1Proficiency", "skill1SelfRating", "skill1Date"
            };
            for (int column = 0; column < values.length; column++) headers.createCell(column).setCellValue(values[column]);

            var employee = sheet.createRow(1);
            String[] employeeValues = {
                    "EMPLOYEE", "EMP-600", "Excel", "Skill", "excel-skill@example.com", "01/31/2021",
                    "GraphQL", "Entry Level", "10", "2024-05-14"
            };
            for (int column = 0; column < employeeValues.length; column++) employee.createCell(column).setCellValue(employeeValues[column]);

            workbook.write(output);
            workbookBytes = output.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile("file", "employees.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", workbookBytes);

        when(employeeRepository.findByEmail("excel-skill@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.findByEmployeeCode("EMP-600")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("employee123")).thenReturn("$2hashed");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = employeeService.bulkImportEmployees(file);

        assertEquals(1, result.getImportedCount());
        assertEquals(0, result.getSkippedCount());
        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        SkillEntry skill = employeeCaptor.getValue().getSkills().get(0);
        assertEquals("GraphQL", skill.getSkillName());
        assertEquals("Entry Level", skill.getProficiency());
        assertEquals(Integer.valueOf(10), skill.getSelfRating());
        assertEquals(LocalDate.of(2024, 5, 14), skill.getSkillDate());
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private EmployeeRequest minimalRequest(String code, String email, String password) {
        EmployeeRequest r = new EmployeeRequest();
        r.setEmployeeCode(code);
        r.setEmail(email);
        r.setPassword(password);
        r.setRole(Role.EMPLOYEE);
        r.setFirstName("First");
        r.setLastName("Last");
        return r;
    }

    private Employee employee(Long id, String code, String email) {
        return Employee.builder()
                .id(id)
                .employeeCode(code)
                .email(email)
                .passwordHash("$2hashed")
                .role(Role.EMPLOYEE)
                .firstName("First")
                .lastName("Last")
                .status(EmployeeStatus.ON_BENCH)
                .firstLogin(true)
                .active(true)
                .build();
    }
}
