package com.service.ServiceImpl;

import com.dto.request.InterviewRequest;
import com.dto.request.InterviewResultRequest;
import com.dto.response.InterviewResponse;
import com.entity.Employee;
import com.entity.Interview;
import com.entity.Project;
import com.entity.ProjectRequirement;
import com.enums.EmployeeStatus;
import com.enums.InterviewRound;
import com.enums.InterviewStatus;
import com.repository.EmployeeRepository;
import com.repository.InterviewRepository;
import com.repository.ProjectRepository;
import com.service.ServiceInterface.InterviewService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class InterviewServiceImpl implements InterviewService {

    private static final List<InterviewRound> ROUND_ORDER = List.of(
            InterviewRound.L1, InterviewRound.L2, InterviewRound.HR
    );

    private final InterviewRepository interviewRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;

    public InterviewServiceImpl(InterviewRepository interviewRepository,
                                 EmployeeRepository employeeRepository,
                                 ProjectRepository projectRepository) {
        this.interviewRepository = interviewRepository;
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
    }

    @Override
    public InterviewResponse scheduleInterview(InterviewRequest request, String clientEmail) {
        if (request.getRound() != InterviewRound.L1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only L1 can be scheduled directly. Schedule later rounds after the previous round passes.");
        }

        Employee employee = findEmployee(request.getEmployeeId());
        Project project = findProject(request.getProjectId());
        ensureClientOwnsProject(project, clientEmail);

        if (employee.getStatus() != EmployeeStatus.SHORTLISTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only shortlisted employees can be interviewed");
        }

        // NEW: resolve the specific requirement (role) and confirm the employee
        // was actually shortlisted for THAT requirement, not just anywhere on the project.
        ProjectRequirement requirement = findRequirement(project, request.getRequirementId());
        ensureEmployeeAssignedToRequirement(requirement, employee.getId());

        ensureRoundDoesNotExist(employee.getId(), project.getId(), InterviewRound.L1);

        Interview interview = newInterview(employee.getId(), project.getId(), InterviewRound.L1, request, requirement);
        return toResponse(interviewRepository.save(interview), employee, project);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getAllInterviews(String clientEmail) {
        return projectRepository.findByClientEmailIgnoreCase(clientEmail).stream()
                .flatMap(project -> interviewRepository.findByProjectId(project.getId()).stream())
                .map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getInterviewsByEmployee(Long employeeId, String clientEmail) {
        findEmployee(employeeId);
        return interviewRepository.findByEmployeeId(employeeId).stream()
                .filter(interview -> projectBelongsToClient(interview.getProjectId(), clientEmail))
                .map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getInterviewsByProject(Long projectId, String clientEmail) {
        ensureClientOwnsProject(findProject(projectId), clientEmail);
        return interviewRepository.findByProjectId(projectId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getMyInterviews(String email) {
        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        List<Interview> interviews = interviewRepository.findByEmployeeId(employee.getId());
        return visibleInterviews(interviews).stream().map(this::toResponse).toList();
    }

    @Override
    public InterviewResponse updateInterviewResult(Long interviewId, InterviewResultRequest request, String clientEmail) {
        Interview interview = findInterview(interviewId);
        ensureClientOwnsProject(findProject(interview.getProjectId()), clientEmail);

        if (interview.getStatus() != InterviewStatus.SCHEDULED || request.getStatus() == InterviewStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A scheduled interview must be marked PASSED or FAILED exactly once");
        }
        if (interview.getScheduledAt() != null && LocalDateTime.now().isBefore(interview.getScheduledAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Interview results can only be recorded after the scheduled time");
        }

        interview.setStatus(request.getStatus());
        Employee employee = findEmployee(interview.getEmployeeId());

        if (request.getStatus() == InterviewStatus.FAILED) {
            employee.setStatus(EmployeeStatus.ON_BENCH);
            employee.setAllocationDate(null);
        }
        if (request.getStatus() == InterviewStatus.PASSED && interview.getRound() == InterviewRound.HR) {
            employee.setStatus(EmployeeStatus.ALLOCATED);
            employee.setAllocationDate(LocalDate.now());
            employeeRepository.save(employee);
        }

        Interview saved = interviewRepository.save(interview);
        return toResponse(saved, employee, findProject(saved.getProjectId()));
    }

    @Override
    public InterviewResponse scheduleNextRound(Long interviewId, InterviewRequest request, String clientEmail) {
        Interview current = findInterview(interviewId);
        ensureClientOwnsProject(findProject(current.getProjectId()), clientEmail);

        if (current.getStatus() != InterviewStatus.PASSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The previous interview must be passed before scheduling the next round");
        }

        InterviewRound next = switch (current.getRound()) {
            case L1 -> InterviewRound.L2;
            case L2 -> InterviewRound.HR;
            case HR -> null;
        };
        if (next == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HR is the final round");
        }

        if (!current.getEmployeeId().equals(request.getEmployeeId())
                || !current.getProjectId().equals(request.getProjectId())
                || request.getRound() != next) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The next interview must use the same employee and project and the required next round");
        }
        // NEW: the role/requirement must carry over unchanged from round to round.
        if (current.getRequirementId() != null && request.getRequirementId() != null
                && !current.getRequirementId().equals(request.getRequirementId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The next interview round must be for the same requirement/role as the previous round");
        }

        ensureRoundDoesNotExist(current.getEmployeeId(), current.getProjectId(), next);

        Employee employee = findEmployee(current.getEmployeeId());
        Project project = findProject(current.getProjectId());

        Interview interview = Interview.builder()
                .employeeId(employee.getId())
                .projectId(project.getId())
                .requirementId(current.getRequirementId())
                .roleName(current.getRoleName())
                .round(next)
                .scheduledAt(request.getScheduledAt())
                .status(InterviewStatus.SCHEDULED)
                .build();

        return toResponse(interviewRepository.save(interview), employee, project);
    }

    private Interview newInterview(Long employeeId, Long projectId, InterviewRound round,
                                    InterviewRequest request, ProjectRequirement requirement) {
        return Interview.builder()
                .employeeId(employeeId)
                .projectId(projectId)
                .requirementId(requirement.getId())
                .roleName(requirement.getRoleName())
                .round(round)
                .scheduledAt(request.getScheduledAt())
                .status(InterviewStatus.SCHEDULED)
                .build();
    }

    private ProjectRequirement findRequirement(Project project, Long requirementId) {
        if (requirementId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "requirementId is required");
        }
        return project.getRequirements().stream()
                .filter(r -> r.getId().equals(requirementId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "That requirement does not belong to the selected project"));
    }

    private void ensureEmployeeAssignedToRequirement(ProjectRequirement requirement, Long employeeId) {
        Set<Long> assignedIds = parseAssignedIds(requirement.getAssignedEmployeeIds());
        if (!assignedIds.contains(employeeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Employee is not shortlisted for the \"" + requirement.getRoleName() + "\" requirement");
        }
    }

    private Set<Long> parseAssignedIds(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toSet());
    }

    private void ensureRoundDoesNotExist(Long employeeId, Long projectId, InterviewRound round) {
        interviewRepository.findByEmployeeIdAndProjectIdAndRound(employeeId, projectId, round).ifPresent(i -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This interview round is already scheduled");
        });
    }

    private Interview findInterview(Long id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private boolean projectBelongsToClient(Long projectId, String clientEmail) {
        return projectRepository.findById(projectId)
                .map(project -> project.getClientEmail() != null && project.getClientEmail().equalsIgnoreCase(clientEmail))
                .orElse(false);
    }

    private void ensureClientOwnsProject(Project project, String clientEmail) {
        if (project.getClientEmail() == null || !project.getClientEmail().equalsIgnoreCase(clientEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this project");
        }
    }

    private InterviewResponse toResponse(Interview i) {
        return toResponse(i, findEmployee(i.getEmployeeId()), findProject(i.getProjectId()));
    }

    private InterviewResponse toResponse(Interview i, Employee e, Project p) {
        return new InterviewResponse(
                i.getId(), e.getId(), e.getEmployeeCode(), e.getFirstName(), e.getLastName(), e.getEmail(),
                p.getId(), p.getName(),
                i.getRequirementId(), i.getRoleName(),
                i.getRound(), i.getScheduledAt(), i.getStatus(), i.getCreatedAt(), i.getUpdatedAt());
    }

    private List<Interview> visibleInterviews(List<Interview> interviews) {
        Map<Long, List<Interview>> byProject = interviews.stream()
                .collect(Collectors.groupingBy(
                        Interview::getProjectId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<Interview> visible = new ArrayList<>();
        for (List<Interview> projectInterviews : byProject.values()) {
            List<Interview> sorted = projectInterviews.stream()
                    .sorted(Comparator.comparingInt(i -> ROUND_ORDER.indexOf(i.getRound())))
                    .toList();

            boolean canSeeNext = true;
            for (Interview interview : sorted) {
                if (!canSeeNext) break;
                visible.add(interview);
                canSeeNext = interview.getStatus() == InterviewStatus.PASSED;
                if (interview.getStatus() == InterviewStatus.FAILED) break;
            }
        }

        visible.sort(Comparator
                .comparing(Interview::getProjectId)
                .thenComparingInt(i -> ROUND_ORDER.indexOf(i.getRound())));
        return visible;
    }
}
