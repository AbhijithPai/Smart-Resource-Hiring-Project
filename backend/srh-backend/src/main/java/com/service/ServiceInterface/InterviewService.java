package com.service.ServiceInterface;

import com.dto.request.InterviewRequest;
import com.dto.request.InterviewResultRequest;
import com.dto.response.InterviewResponse;

import java.util.List;

public interface InterviewService {
    InterviewResponse scheduleInterview(InterviewRequest request, String clientEmail);
    List<InterviewResponse> getAllInterviews(String clientEmail);
    List<InterviewResponse> getInterviewsByEmployee(Long employeeId, String clientEmail);
    List<InterviewResponse> getInterviewsByProject(Long projectId, String clientEmail);
    List<InterviewResponse> getMyInterviews(String email);
    InterviewResponse updateInterviewResult(Long interviewId, InterviewResultRequest request, String clientEmail);
    InterviewResponse scheduleNextRound(Long interviewId, InterviewRequest request, String clientEmail);
}
