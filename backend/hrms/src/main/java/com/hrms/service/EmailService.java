package com.hrms.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Email address configured for the application.
     *
     * Production should provide this through an environment variable
     * or external configuration.
     */
    @Value("${spring.mail.username}")
    private String fromEmail;

    // ============================================================
    // LOGIN OTP
    // ============================================================

    /**
     * Sends OTP specifically for LOGIN verification.
     *
     * Used after the configured number of failed password attempts.
     */
    public void sendLoginOtpEmail(
            String email,
            String otp,
            String employeeName) {

        validateEmail(email, "Employee email is required");
        validateValue(otp, "Login OTP is required");

        String name = normalizeName(employeeName);

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(normalizeEmail(email));
        message.setSubject("HRMS - Login Verification OTP");

        message.setText(
                "Hello " + name + ",\n\n"
                        + "Your HRMS login requires OTP verification.\n\n"
                        + "Your login OTP is:\n\n"
                        + otp + "\n\n"
                        + "This OTP is valid for 10 minutes.\n\n"
                        + "If you did not attempt to log in, "
                        + "please contact your HR/Admin immediately.\n\n"
                        + "Regards,\n"
                        + "Saiteja Infotech Private Limited\n"
                        + "HRMS Team");

        sendSimpleMessage(
                message,
                "Failed to send login OTP email.");
    }

    // ============================================================
    // PASSWORD RESET OTP
    // ============================================================

    /**
     * Sends OTP for password reset.
     */
    public void sendPasswordResetOtpEmail(
            String email,
            String otp,
            String employeeName) {

        validateEmail(email, "Employee email is required");
        validateValue(otp, "Password reset OTP is required");

        String name = normalizeName(employeeName);

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(normalizeEmail(email));
        message.setSubject("HRMS - Password Reset OTP");

        message.setText(
                "Hello " + name + ",\n\n"
                        + "We received a request to reset your HRMS password.\n\n"
                        + "Your password reset OTP is:\n\n"
                        + otp + "\n\n"
                        + "This OTP is valid for 10 minutes.\n\n"
                        + "Use this OTP only on the HRMS password reset page.\n\n"
                        + "If you did not request a password reset, "
                        + "please ignore this email and contact HR/Admin "
                        + "if you believe your account may be at risk.\n\n"
                        + "Regards,\n"
                        + "Saiteja Infotech Private Limited\n"
                        + "HRMS Team");

        sendSimpleMessage(
                message,
                "Failed to send password reset OTP email.");
    }

    // ============================================================
    // GENERIC EMAIL
    // ============================================================

    /**
     * Sends a normal plain-text email.
     */
    public void sendEmail(
            String to,
            String subject,
            String body) {

        validateEmail(to, "Recipient email is required");

        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException(
                    "Email subject is required");
        }

        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException(
                    "Email body is required");
        }

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(normalizeEmail(to));
        message.setSubject(subject.trim());
        message.setText(body);

        sendSimpleMessage(
                message,
                "Failed to send email.");
    }

    // ============================================================
    // EMAIL WITH ATTACHMENT
    // ============================================================

    /**
     * Sends an email with a MultipartFile attachment.
     *
     * Signature preserved because GreetingService already uses it.
     */
    public void sendEmailWithAttachment(
            String from,
            List<String> recipients,
            String subject,
            String body,
            MultipartFile attachment,
            String attachmentName) {

        if (recipients == null || recipients.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one recipient email is required");
        }

        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException(
                    "Email subject is required");
        }

        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException(
                    "Email body is required");
        }

        if (attachment == null || attachment.isEmpty()) {
            throw new IllegalArgumentException(
                    "Email attachment is required");
        }

        String actualAttachmentName = attachmentName == null || attachmentName.isBlank()
                ? attachment.getOriginalFilename()
                : attachmentName.trim();

        if (actualAttachmentName == null
                || actualAttachmentName.isBlank()) {

            actualAttachmentName = "attachment";
        }

        try {

            MimeMessage mimeMessage = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    true,
                    "UTF-8");

            /*
             * Do not blindly trust a caller-supplied "from" address
             * in production. Use the configured application mailbox.
             */
            helper.setFrom(fromEmail);

            String[] recipientArray = recipients.stream()
                    .filter(email -> email != null
                            && !email.isBlank())
                    .map(this::normalizeEmail)
                    .distinct()
                    .toArray(String[]::new);

            if (recipientArray.length == 0) {
                throw new IllegalArgumentException(
                        "No valid recipient email addresses provided");
            }

            helper.setTo(recipientArray);
            helper.setSubject(subject.trim());
            helper.setText(body);

            InputStreamSource source = new ByteArrayResource(
                    attachment.getBytes());

            helper.addAttachment(
                    actualAttachmentName,
                    source);

            mailSender.send(mimeMessage);

        } catch (MessagingException e) {

            throw new RuntimeException(
                    "Failed to create email with attachment.",
                    e);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to send email with attachment.",
                    e);
        }
    }

    // ============================================================
    // DOCUMENT REQUEST EMAIL
    // ============================================================

    /**
     * Sends a document request email.
     *
     * Signature preserved because DocumentRequestService already
     * uses this method.
     */
    public void sendDocumentRequestEmail(
            String employeeEmail,
            String employeeName,
            String documentName,
            LocalDate startDate,
            LocalDate endDate,
            String messageText) {

        validateEmail(
                employeeEmail,
                "Employee email is required");

        String name = normalizeName(employeeName);

        String document = documentName == null || documentName.isBlank()
                ? "Requested document"
                : documentName.trim();

        StringBuilder body = new StringBuilder();

        body.append("Hello ")
                .append(name)
                .append(",\n\n");

        body.append(
                "A document request has been created for you "
                        + "in the HRMS system.\n\n");

        body.append("Document: ")
                .append(document)
                .append("\n");

        if (startDate != null) {
            body.append("Start Date: ")
                    .append(startDate)
                    .append("\n");
        }

        if (endDate != null) {
            body.append("End Date: ")
                    .append(endDate)
                    .append("\n");
        }

        if (messageText != null
                && !messageText.isBlank()) {

            body.append("\nMessage:\n")
                    .append(messageText.trim())
                    .append("\n");
        }

        body.append("\n")
                .append(
                        "Please log in to HRMS and complete the "
                                + "requested action.\n");

        body.append("\nRegards,\n")
                .append("Saiteja Infotech Private Limited\n")
                .append("HRMS Team");

        sendEmail(
                employeeEmail,
                "HRMS - Document Request",
                body.toString());
    }

    // ============================================================
    // INTERNAL SEND METHOD
    // ============================================================

    private void sendSimpleMessage(
            SimpleMailMessage message,
            String errorMessage) {

        try {

            mailSender.send(message);

        } catch (Exception e) {

            throw new RuntimeException(
                    errorMessage
                            + " Please check the email server configuration.",
                    e);
        }
    }

    // ============================================================
    // VALIDATION
    // ============================================================

    private void validateEmail(
            String email,
            String errorMessage) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    errorMessage);
        }
    }

    private void validateValue(
            String value,
            String errorMessage) {

        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    errorMessage);
        }
    }

    // ============================================================
    // NORMALIZE EMAIL
    // ============================================================

    private String normalizeEmail(String email) {

        return email.trim().toLowerCase();
    }

    // ============================================================
    // NORMALIZE EMPLOYEE NAME
    // ============================================================

    private String normalizeName(String employeeName) {

        if (employeeName == null
                || employeeName.isBlank()) {

            return "Employee";
        }

        return employeeName.trim();
    }
}