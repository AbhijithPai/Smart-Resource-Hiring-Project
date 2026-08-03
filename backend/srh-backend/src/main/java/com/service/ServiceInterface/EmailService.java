package com.service.ServiceInterface;

import com.entity.Employee;

public interface EmailService {

    /**
     * Sends a shortlist notification email to the employee informing them
     * that they have been shortlisted for a project interview.
     *
     * @param employee    the employee who was shortlisted
     * @param projectName the name of the demand project they were shortlisted for
     */
    void sendShortlistNotification(Employee employee, String projectName);
}
