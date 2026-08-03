package com.controller;

import com.dto.request.InterviewRequest;
import com.dto.request.InterviewResultRequest;
import com.dto.response.InterviewResponse;
import com.service.ServiceInterface.InterviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {
    private final InterviewService interviewService;
    public InterviewController(InterviewService interviewService) { this.interviewService = interviewService; }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<InterviewResponse> scheduleInterview(@Valid @RequestBody InterviewRequest request, Authentication auth) { return ResponseEntity.status(HttpStatus.CREATED).body(interviewService.scheduleInterview(request, auth.getName())); }
    @GetMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<InterviewResponse>> getAllInterviews(Authentication auth) { return ResponseEntity.ok(interviewService.getAllInterviews(auth.getName())); }
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<InterviewResponse>> getInterviewsByEmployee(@PathVariable Long employeeId, Authentication auth) { return ResponseEntity.ok(interviewService.getInterviewsByEmployee(employeeId, auth.getName())); }
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<InterviewResponse>> getInterviewsByProject(@PathVariable Long projectId, Authentication auth) { return ResponseEntity.ok(interviewService.getInterviewsByProject(projectId, auth.getName())); }
    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<InterviewResponse>> getMyInterviews(Authentication auth) { return ResponseEntity.ok(interviewService.getMyInterviews(auth.getName())); }
    @PutMapping("/{id}/result")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<InterviewResponse> updateInterviewResult(@PathVariable Long id, @Valid @RequestBody InterviewResultRequest request, Authentication auth) { return ResponseEntity.ok(interviewService.updateInterviewResult(id, request, auth.getName())); }
    @PostMapping("/{id}/next-round")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<InterviewResponse> scheduleNextRound(@PathVariable Long id, @Valid @RequestBody InterviewRequest request, Authentication auth) { return ResponseEntity.status(HttpStatus.CREATED).body(interviewService.scheduleNextRound(id, request, auth.getName())); }
}
