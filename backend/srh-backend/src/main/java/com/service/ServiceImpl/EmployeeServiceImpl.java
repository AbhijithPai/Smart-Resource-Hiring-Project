package com.service.ServiceImpl;

import com.dto.request.EmployeeRequest;
import com.dto.request.EmployeeUpdateRequest;
import com.dto.response.BulkImportResponse;
import com.dto.response.EmployeeProjectAssignmentResponse;
import com.dto.response.EmployeeResponse;
import com.entity.Certification;
import com.entity.Employee;
import com.entity.Project;
import com.entity.ProjectHistory;
import com.entity.ProjectRequirement;
import com.entity.SkillEntry;
import com.enums.EmployeeStatus;
import com.enums.Role;
import com.repository.EmployeeRepository;
import com.repository.ProjectRepository;
import com.service.ServiceInterface.EmployeeService;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.repository.InterviewRepository;
import com.entity.Interview;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Arrays;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private static final List<DateTimeFormatter> IMPORT_DATE_FORMATS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("M/d/uuuu"),
            DateTimeFormatter.ofPattern("MM/dd/uuuu"),
            DateTimeFormatter.ofPattern("d/M/uuuu"),
            DateTimeFormatter.ofPattern("dd/MM/uuuu")
    );

    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeService self;
    private final InterviewRepository interviewRepository;
    private final com.scheduler.ProjectExpiryScheduler projectExpiryScheduler;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               ProjectRepository projectRepository,
                               InterviewRepository interviewRepository,
                               PasswordEncoder passwordEncoder,
                               @Lazy EmployeeService self,
                               com.scheduler.ProjectExpiryScheduler projectExpiryScheduler) {
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
        this.interviewRepository = interviewRepository;
        this.passwordEncoder = passwordEncoder;
        this.self = self;
        this.projectExpiryScheduler = projectExpiryScheduler;
    }

    @Override
    public EmployeeResponse saveEmployee(EmployeeRequest request) {
        ensureEmailAvailable(request.getEmail(), null);
        ensureEmployeeCodeAvailable(request.getEmployeeCode(), null);

        Employee employee = buildEmployee(request);
        return toResponse(employeeRepository.save(employee));
    }

    private Employee buildEmployee(EmployeeRequest request) {
        Employee employee = new Employee();
        employee.setEmployeeCode(request.getEmployeeCode());
        employee.setEmail(request.getEmail());
        employee.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        employee.setRole(request.getRole());
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setDepartment(request.getDepartment());
        employee.setDesignation(request.getDesignation());
        employee.setLocation(request.getLocation());
        employee.setJoiningDate(request.getJoiningDate());
        employee.setStatus(request.getStatus() == null ? EmployeeStatus.ON_BENCH : request.getStatus());
        employee.setBenchStartDate(request.getBenchStartDate());
        employee.setManagerId(request.getManagerId());
        employee.setExperienceYears(request.getExperienceYears());
        employee.setActive(request.getActive() == null || request.getActive());
        employee.setSkills(request.getSkills());
        employee.setCertifications(request.getCertifications());
        employee.setProjectHistory(request.getProjectHistory());
        return employee;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public List<EmployeeResponse> getAllEmployees() {
        // Release employees from any expired projects before returning the list
        projectExpiryScheduler.releaseExpiredProjects();
        return employeeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public EmployeeResponse getEmployeeById(Long id) {
        return toResponse(findEmployeeById(id));
    }

    @Override
    public EmployeeResponse getEmployeeByEmail(String email) {
        return toResponse(findEmployeeByEmail(email));
    }

    @Override
    public EmployeeResponse updateEmployee(Long id, EmployeeUpdateRequest request) {
        Employee employee = findEmployeeById(id);
        applyAdminUpdates(employee, request);
        return toResponse(employeeRepository.save(employee));
    }

    @Override
    public EmployeeResponse updateOwnProfile(String email, EmployeeUpdateRequest request) {
        Employee employee = findEmployeeByEmail(email);

        if (request.getPhoneNumber() != null) employee.setPhoneNumber(request.getPhoneNumber());
        if (request.getLocation() != null) employee.setLocation(request.getLocation());
        if (request.getExperienceYears() != null) employee.setExperienceYears(request.getExperienceYears());
        if (request.getSkills() != null) employee.setSkills(request.getSkills());
        if (request.getCertifications() != null) employee.setCertifications(request.getCertifications());

        return toResponse(employeeRepository.save(employee));
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public BulkImportResponse bulkImportEmployees(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Import file is required");
        }

        List<Map<String, String>> rows = readImportRows(file);
        int importedCount = 0;
        int skippedCount = 0;
        List<String> errors = new ArrayList<>();

        for (int index = 0; index < rows.size(); index++) {
            int rowNumber = index + 2;
            try {
                self.importEmployeeRow(toEmployeeRequest(rows.get(index)));
                importedCount++;
            } catch (Exception exception) {
                skippedCount++;
                errors.add("Row " + rowNumber + ": " + exception.getMessage());
            }
        }

        return new BulkImportResponse(importedCount, skippedCount, errors);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public EmployeeResponse importEmployeeRow(EmployeeRequest request) {
        return saveEmployee(request);
    }

    @Override
    public void deleteEmployee(Long id) {
        Employee employee = findEmployeeById(id);

        // Remove interview records tied to this employee so no orphaned rows remain.
        interviewRepository.deleteByEmployeeId(id);

        // Strip this employee's id out of any project requirement's assignedEmployeeIds
        // string so shortlisted/allocated projects don't reference a deleted employee.
        List<Project> projects = projectRepository.findAll();
        boolean anyProjectChanged = false;
        for (Project project : projects) {
            for (ProjectRequirement requirement : project.getRequirements()) {
                String assignedIds = requirement.getAssignedEmployeeIds();
                if (assignedIds == null || assignedIds.isBlank()) {
                    continue;
                }
                String cleaned = Arrays.stream(assignedIds.split(","))
                        .map(String::trim)
                        .filter(value -> !value.isEmpty())
                        .filter(value -> !value.equals(String.valueOf(id)))
                        .collect(Collectors.joining(","));
                if (!cleaned.equals(assignedIds)) {
                    requirement.setAssignedEmployeeIds(cleaned);
                    anyProjectChanged = true;
                }
            }
        }
        if (anyProjectChanged) {
            projectRepository.saveAll(projects);
        }

        employeeRepository.delete(employee);
    }
    private Employee findEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found with id: " + id));
    }

    private Employee findEmployeeByEmail(String email) {
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found with email: " + email));
    }

    private void applyAdminUpdates(Employee employee, EmployeeUpdateRequest request) {
        if (request.getEmployeeCode() != null) {
            ensureEmployeeCodeAvailable(request.getEmployeeCode(), employee.getId());
            employee.setEmployeeCode(request.getEmployeeCode());
        }
        if (request.getEmail() != null) {
            ensureEmailAvailable(request.getEmail(), employee.getId());
            employee.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            employee.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) employee.setRole(request.getRole());
        if (request.getFirstName() != null) employee.setFirstName(request.getFirstName());
        if (request.getLastName() != null) employee.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null) employee.setPhoneNumber(request.getPhoneNumber());
        if (request.getDepartment() != null) employee.setDepartment(request.getDepartment());
        if (request.getDesignation() != null) employee.setDesignation(request.getDesignation());
        if (request.getLocation() != null) employee.setLocation(request.getLocation());
        if (request.getJoiningDate() != null) employee.setJoiningDate(request.getJoiningDate());
        if (request.getStatus() != null) employee.setStatus(request.getStatus());
        if (request.getBenchStartDate() != null) employee.setBenchStartDate(request.getBenchStartDate());
        if (request.getManagerId() != null) employee.setManagerId(request.getManagerId());
        if (request.getExperienceYears() != null) employee.setExperienceYears(request.getExperienceYears());
        if (request.getFirstLogin() != null) employee.setFirstLogin(request.getFirstLogin());
        if (request.getActive() != null) employee.setActive(request.getActive());
        if (request.getSkills() != null) employee.setSkills(request.getSkills());
        if (request.getCertifications() != null) employee.setCertifications(request.getCertifications());
        if (request.getProjectHistory() != null) employee.setProjectHistory(request.getProjectHistory());
    }

    private void ensureEmailAvailable(String email, Long currentEmployeeId) {
        employeeRepository.findByEmail(email)
                .filter(employee -> !Objects.equals(employee.getId(), currentEmployeeId))
                .ifPresent(employee -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee email already exists");
                });
    }

    private void ensureEmployeeCodeAvailable(String employeeCode, Long currentEmployeeId) {
        employeeRepository.findByEmployeeCode(employeeCode)
                .filter(employee -> !Objects.equals(employee.getId(), currentEmployeeId))
                .ifPresent(employee -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee code already exists");
                });
    }

    private EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getEmail(),
                employee.getRole(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getPhoneNumber(),
                employee.getDepartment(),
                employee.getDesignation(),
                employee.getLocation(),
                employee.getJoiningDate(),
                employee.getStatus(),
                employee.getBenchStartDate(),
                employee.getAllocationDate(),
                employee.getManagerId(),
                employee.getExperienceYears(),
                employee.getFirstLogin(),
                employee.getActive(),
                employee.getSkills(),
                employee.getCertifications(),
                employee.getProjectHistory(),
                resolveProjectAssignments(employee)
        );
    }


    private List<EmployeeProjectAssignmentResponse> resolveProjectAssignments(Employee employee) {
        if (employee.getStatus() != EmployeeStatus.SHORTLISTED && employee.getStatus() != EmployeeStatus.ALLOCATED) {
            return List.of();
        }
        Map<String, String> clientNamesByEmail = employeeRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.CLIENT)
                .collect(Collectors.toMap(
                        user -> user.getEmail().toLowerCase(),
                        user -> user.getFirstName() + " " + user.getLastName(),
                        (left, right) -> left
                ));

        Set<Long> interviewProjectIds = interviewRepository.findByEmployeeId(employee.getId()).stream()
                .map(Interview::getProjectId)
                .collect(Collectors.toSet());

        List<EmployeeProjectAssignmentResponse> assignments = new ArrayList<>();
        for (Project project : projectRepository.findAll()) {
            ProjectRequirement matchedRequirement = null;
            for (ProjectRequirement requirement : project.getRequirements()) {
                if (parseEmployeeIds(requirement.getAssignedEmployeeIds()).contains(employee.getId())) {
                    matchedRequirement = requirement;
                    break;
                }
            }

            boolean hasInterview = interviewProjectIds.contains(project.getId());
            if (matchedRequirement == null && !hasInterview) {
                continue;
            }

            String roleName = matchedRequirement != null
                    ? matchedRequirement.getRoleName()
                    : (project.getRequirements().isEmpty() ? "Unspecified" : project.getRequirements().get(0).getRoleName());

            String clientEmail = project.getClientEmail();
            String clientName = clientEmail == null
                    ? null
                    : clientNamesByEmail.getOrDefault(clientEmail.toLowerCase(), clientEmail);

            assignments.add(new EmployeeProjectAssignmentResponse(
                    project.getId(),
                    project.getName(),
                    project.getDescription(),
                    clientName,
                    clientEmail,
                    roleName
            ));
        }
        return assignments;
    }


    private boolean isAssignedToRequirement(ProjectRequirement requirement, Long employeeId) {
        if (requirement.getAssignedEmployeeIds() == null || requirement.getAssignedEmployeeIds().isBlank()) {
            return false;
        }
        return Arrays.stream(requirement.getAssignedEmployeeIds().split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .map(Long::valueOf)
                .anyMatch(id -> id.equals(employeeId));
    }

    private String resolveClientName(String clientEmail) {
        if (clientEmail == null || clientEmail.isBlank()) {
            return "Unknown Client";
        }
        return employeeRepository.findByEmail(clientEmail)
                .map(client -> (client.getFirstName() + " " + client.getLastName()).trim())
                .filter(name -> !name.isBlank())
                .orElse(clientEmail);
    }

    private Set<Long> parseEmployeeIds(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        return List.of(value.split(",")).stream()
                .map(String::trim)
                .filter(id -> !id.isBlank())
                .map(Long::valueOf)
                .collect(Collectors.toSet());
    }

    private List<Map<String, String>> readImportRows(MultipartFile file) {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                return readExcelRows(file);
            }
            return readCsvRows(file);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read import file");
        }
    }

    private List<Map<String, String>> readCsvRows(MultipartFile file) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return rows;
            List<String> headers = parseCsvLine(headerLine).stream().map(this::normalizeHeader).toList();

            String line;
            while ((line = reader.readLine()) != null) {
                List<String> values = parseCsvLine(line);
                rows.add(toRowMap(headers, values));
            }
        }
        return rows;
    }

    private List<Map<String, String>> readExcelRows(MultipartFile file) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return rows;

            List<String> headers = new ArrayList<>();
            for (int cellIndex = 0; cellIndex < headerRow.getLastCellNum(); cellIndex++) {
                headers.add(normalizeHeader(formatter.formatCellValue(headerRow.getCell(cellIndex))));
            }

            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) continue;
                List<String> values = new ArrayList<>();
                for (int cellIndex = 0; cellIndex < headers.size(); cellIndex++) {
                    values.add(formatter.formatCellValue(row.getCell(cellIndex)));
                }
                rows.add(toRowMap(headers, values));
            }
        }
        return rows;
    }

    private Map<String, String> toRowMap(List<String> headers, List<String> values) {
        values = alignCsvValues(headers, values);
        Map<String, String> row = new HashMap<>();
        for (int index = 0; index < headers.size(); index++) {
            row.put(headers.get(index), index < values.size() ? values.get(index).trim() : "");
        }
        return row;
    }

    private List<String> alignCsvValues(List<String> headers, List<String> values) {
        if (values.size() <= headers.size()) return values;

        int skillsIndex = headers.indexOf("skills");
        int certificationsIndex = headers.indexOf("certifications");
        int projectHistoryIndex = headers.indexOf("projecthistory");
        int mergeIndex = skillsIndex >= 0 ? skillsIndex : certificationsIndex >= 0 ? certificationsIndex : projectHistoryIndex;

        if (mergeIndex < 0 || mergeIndex >= headers.size() - 1) {
            return values.subList(0, headers.size());
        }

        int extraValues = values.size() - headers.size();
        List<String> aligned = new ArrayList<>(values);
        for (int i = 0; i < extraValues; i++) {
            String next = aligned.remove(mergeIndex + 1);
            aligned.set(mergeIndex, aligned.get(mergeIndex) + "," + next);
        }

        if (aligned.size() > headers.size()) {
            return aligned.subList(0, headers.size());
        }
        return aligned;
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;

        for (int index = 0; index < line.length(); index++) {
            char value = line.charAt(index);
            if (value == '"') {
                quoted = !quoted;
            } else if (value == ',' && !quoted) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(value);
            }
        }
        values.add(current.toString());
        return values;
    }

    private EmployeeRequest toEmployeeRequest(Map<String, String> row) {
        EmployeeRequest request = new EmployeeRequest();
        request.setEmployeeCode(required(row, "employeeCode"));
        request.setEmail(required(row, "email"));
        String rawPassword = value(row, "password");
        if (rawPassword.isBlank()) {
            rawPassword = value(row, "defaultPassword");
        }
        request.setPassword(rawPassword.isBlank() ? "employee123" : rawPassword);
        request.setRole(parseRole(value(row, "role")));
        request.setFirstName(required(row, "firstName"));
        request.setLastName(required(row, "lastName"));
        request.setPhoneNumber(value(row, "phoneNumber"));
        request.setDepartment(value(row, "department"));
        request.setDesignation(value(row, "designation"));
        request.setLocation(value(row, "location"));
        request.setJoiningDate(parseDate(value(row, "joiningDate")));
        request.setStatus(parseEmployeeStatus(value(row, "status")));
        request.setBenchStartDate(parseDate(value(row, "benchStartDate")));
        request.setManagerId(parseLong(value(row, "managerId")));
        request.setExperienceYears(parseDecimal(value(row, "experienceYears")));
        request.setActive(parseBoolean(value(row, "active")));
        request.setSkills(parseSkills(row));
        request.setCertifications(parseCertifications(value(row, "certifications")));
        request.setProjectHistory(parseProjectHistory(value(row, "projectHistory")));
        return request;
    }

    private String required(Map<String, String> row, String key) {
        String value = value(row, key);
        if (value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " is required");
        }
        return value;
    }

    private String value(Map<String, String> row, String key) {
        return row.getOrDefault(normalizeHeader(key), "");
    }

    private String normalizeHeader(String value) {
        return value == null ? "" : value.replaceAll("[^A-Za-z0-9]", "").toLowerCase();
    }

    private Role parseRole(String value) {
        if (value == null || value.isBlank()) return Role.EMPLOYEE;
        String normalized = value.trim().toUpperCase();
        if ("PROJECT_ADMIN".equals(normalized)) return Role.PROJECT_ADMINISTRATOR;
        return Role.valueOf(normalized);
    }

    private EmployeeStatus parseEmployeeStatus(String value) {
        return value == null || value.isBlank() ? EmployeeStatus.ON_BENCH : EmployeeStatus.valueOf(value.trim().toUpperCase());
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;

        String trimmed = value.trim();
        for (DateTimeFormatter formatter : IMPORT_DATE_FORMATS) {
            try {
                return LocalDate.parse(trimmed, formatter);
            } catch (DateTimeParseException ignored) {
                // Try the next common spreadsheet format.
            }
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Date '" + value + "' must be in yyyy-MM-dd or MM/dd/yyyy format"
        );
    }

    private Long parseLong(String value) {
        return value == null || value.isBlank() ? null : Long.valueOf(value.trim());
    }

    private BigDecimal parseDecimal(String value) {
        return value == null || value.isBlank() ? null : new BigDecimal(value.trim());
    }

    private Boolean parseBoolean(String value) {
        return value == null || value.isBlank() ? null : Boolean.valueOf(value.trim());
    }

    private List<SkillEntry> parseSkills(Map<String, String> row) {
        List<SkillEntry> skills = new ArrayList<>();

        List<SkillEntry> indexedSkills = parseIndexedSkills(row);
        if (!indexedSkills.isEmpty()) {
            return indexedSkills;
        }

        String skillsValue = value(row, "skills");
        if (skillsValue.isBlank()) {
            return skills;
        }

        for (String entry : splitSkillEntries(skillsValue)) {
            SkillEntry skill = parseSkillEntry(entry);
            if (skill != null) {
                skills.add(skill);
            }
        }

        return skills;
    }

    private List<SkillEntry> parseIndexedSkills(Map<String, String> row) {
        List<SkillEntry> skills = new ArrayList<>();
        for (int index = 1; index <= 50; index++) {
            String skillName = firstNonBlank(row,
                    "skill" + index + "name",
                    "skillname" + index,
                    "skill" + index,
                    "skilltitle" + index);
            String selfRating = firstNonBlank(row,
                    "skill" + index + "selfrating",
                    "selfrating" + index,
                    "rating" + index,
                    "skillrating" + index);
            String skillDate = firstNonBlank(row,
                    "skill" + index + "date",
                    "skilldate" + index,
                    "skilldateof" + index,
                    "skillobtaineddate" + index);
            String proficiency = firstNonBlank(row,
                    "skill" + index + "proficiency",
                    "proficiency" + index,
                    "level" + index);
            String years = firstNonBlank(row,
                    "yearsofexperience" + index,
                    "experienceyears" + index);

            if (skillName.isBlank() && selfRating.isBlank() && skillDate.isBlank() && proficiency.isBlank() && years.isBlank()) {
                if (index == 1) continue;
                break;
            }

            skills.add(SkillEntry.builder()
                    .skillName(skillName.isBlank() ? null : skillName)
                    .selfRating(parseInteger(selfRating))
                    .skillDate(parseDate(skillDate))
                    .proficiency(proficiency.isBlank() ? null : proficiency)
                    .yearsOfExperience(parseDecimal(years))
                    .build());
        }

        return skills.stream()
                .filter(skill -> skill.getSkillName() != null && !skill.getSkillName().isBlank())
                .toList();
    }

    private SkillEntry parseSkillEntry(String entry) {
        if (entry == null || entry.isBlank()) return null;

        String[] parts = entry.split("\\|", -1);
        String skillName = parts.length > 0 ? parts[0].trim() : "";
        String proficiency = parts.length > 1 ? parts[1].trim() : "";
        String selfRating = parts.length > 2 ? parts[2].trim() : "";
        String skillDate = parts.length > 3 ? parts[3].trim() : "";
        String years = parts.length > 4 ? parts[4].trim() : "";

        if (parts.length == 1) {
            String[] colonParts = entry.split(":", -1);
            if (colonParts.length > 1) {
                skillName = colonParts[0].trim();
                if (colonParts.length > 1) selfRating = colonParts[1].trim();
                if (colonParts.length > 2) skillDate = colonParts[2].trim();
                if (colonParts.length > 3) proficiency = colonParts[3].trim();
                if (colonParts.length > 4) years = colonParts[4].trim();
            }
        }

        if (skillName.isBlank()) return null;

        return SkillEntry.builder()
                .skillName(skillName)
                .proficiency(proficiency.isBlank() ? null : proficiency)
                .selfRating(parseInteger(selfRating))
                .skillDate(parseDate(skillDate))
                .yearsOfExperience(parseDecimal(years))
                .build();
    }

    private List<Certification> parseCertifications(String value) {
        return splitValues(value).stream()
                .map(certificationName -> Certification.builder().certificationName(certificationName).build())
                .toList();
    }

    private List<ProjectHistory> parseProjectHistory(String value) {
        return splitValues(value).stream()
                .map(projectName -> ProjectHistory.builder().projectName(projectName).build())
                .toList();
    }

    private List<String> splitValues(String value) {
        if (value == null || value.isBlank()) return new ArrayList<>();
        return List.of(value.split("[,;]")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .toList();
    }

    private List<String> splitSkillEntries(String value) {
        if (value == null || value.isBlank()) return new ArrayList<>();
        if (value.contains("|")) {
            return List.of(value.split("\\s*;\\s*")).stream()
                    .map(String::trim)
                    .filter(item -> !item.isBlank())
                    .toList();
        }
        return splitValues(value);
    }

    private String firstNonBlank(Map<String, String> row, String... keys) {
        for (String key : keys) {
            String candidate = value(row, key);
            if (!candidate.isBlank()) {
                return candidate;
            }
        }
        return "";
    }

    private Integer parseInteger(String value) {
        return value == null || value.isBlank() ? null : Integer.valueOf(value.trim());
    }
}
