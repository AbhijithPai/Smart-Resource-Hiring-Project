package com.service.ServiceImpl;

import com.entity.Employee;
import com.service.ServiceInterface.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendShortlistNotification(Employee employee, String projectName) {
        String fullName = employee.getFirstName() + " " + employee.getLastName();
        String subject = "You have been shortlisted for an interview – " + projectName;
        String body = """
                Dear %s,

                Congratulations! You have been shortlisted for the project "%s".

                Your profile matches the requirements and you may be contacted shortly \
                to schedule an interview. Please ensure your contact details are up to date.

                Regards,
                Smart Resource Hiring Team
                """.formatted(fullName, projectName);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(employee.getEmail());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Shortlist notification sent to {}", employee.getEmail());
        } catch (MailException ex) {
            // Log and continue — email failure should not block the shortlisting operation
            log.warn("Failed to send shortlist notification to {}: {}", employee.getEmail(), ex.getMessage());
        }
    }
}
