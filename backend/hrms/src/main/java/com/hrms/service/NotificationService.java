package com.hrms.service;

import com.hrms.dto.NotificationDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Notification;
import com.hrms.entity.Notification.NotificationType;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final JavaMailSender mailSender;
    private final EmployeeRepository employeeRepository;

    /*
     * Create and send notification to one employee.
     */
    @Transactional
    public Notification createAndSend(
            Employee recipient,
            String title,
            String message,
            NotificationType type,
            String refType,
            Long refId) {

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type)
                .referenceType(refType)
                .referenceId(refId)
                .isRead(false)
                .build();

        Notification saved = notificationRepo.save(notification);

        /*
         * Send email without blocking the notification creation.
         */
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            sendEmailSafe(
                    recipient.getEmail(),
                    title,
                    message
            );
        });

        return saved;
    }

    /*
     * Notify all active ADMIN + HR employees.
     */
    @Transactional
    public void notifyAllAdmins(
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId,
            Long excludeId) {

        employeeRepository.findAll()
                .stream()
                .filter(e ->
                        e.isActive()
                                &&
                        (
                                e.getRole() == Role.ADMIN
                                        ||
                                e.getRole() == Role.HR
                        )
                                &&
                        (
                                excludeId == null
                                        ||
                                !e.getId().equals(excludeId)
                        )
                )
                .forEach(admin ->
                        createAndSend(
                                admin,
                                title,
                                message,
                                type,
                                entityType,
                                entityId
                        )
                );
    }

    /*
     * Overload without excludeId.
     */
    @Transactional
    public void notifyAllAdmins(
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId) {

        notifyAllAdmins(
                title,
                message,
                type,
                entityType,
                entityId,
                null
        );
    }

    /*
     * Send email safely.
     *
     * Email failure will not break
     * notification creation.
     */
    private void sendEmailSafe(
            String toEmail,
            String subject,
            String body) {

        try {

            SimpleMailMessage mail =
                    new SimpleMailMessage();

            mail.setTo(toEmail);
            mail.setSubject(subject);
            mail.setText(body);

            mailSender.send(mail);

        } catch (Exception e) {

            log.warn(
                    "Email notification failed for {}: {}",
                    toEmail,
                    e.getMessage()
            );
        }
    }

    /*
     * Get all notifications belonging
     * to the logged-in employee.
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTOs.Response> getMyNotifications(
            Employee employee,
            Pageable pageable) {

        return notificationRepo
                .findByRecipient(employee, pageable)
                .map(this::toResponse);
    }

    /*
     * Get unread notifications.
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTOs.Response> getUnread(
            Employee employee,
            Pageable pageable) {

        return notificationRepo
                .findByRecipientAndIsReadFalse(
                        employee,
                        pageable
                )
                .map(this::toResponse);
    }

    /*
     * Get unread notification count.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Employee employee) {

        return notificationRepo
                .countByRecipientAndIsReadFalse(employee);
    }

    /*
     * Mark ONE notification as read.
     *
     * Ownership is checked so one employee
     * cannot modify another employee's notification.
     */
    @Transactional
    public void markAsRead(
            Long notificationId,
            Employee employee) {

        Notification notification =
                notificationRepo.findById(notificationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Notification not found"
                                )
                        );

        verifyOwnership(
                notification,
                employee
        );

        notification.setRead(true);

        notificationRepo.save(notification);
    }

    /*
     * Mark ALL notifications as read
     * for the logged-in employee.
     */
    @Transactional
    public void markAllAsRead(Employee employee) {

        notificationRepo.markAllAsReadByRecipient(
                employee
        );
    }

    /*
     * Delete ONE notification.
     *
     * The database query itself checks that
     * the notification belongs to the logged-in employee.
     */
    @Transactional
    public void deleteNotification(
            Long notificationId,
            Employee employee) {

        int deleted =
                notificationRepo.deleteByIdAndRecipient(
                        notificationId,
                        employee
                );

        if (deleted == 0) {

            throw new IllegalArgumentException(
                    "Notification not found or you do not have permission to delete it"
            );
        }
    }

    /*
     * Delete ALL notifications belonging
     * to the currently logged-in employee.
     *
     * Works for:
     *
     * ADMIN
     * HR
     * EMPLOYEE
     */
    @Transactional
    public void clearAllNotifications(
            Employee employee) {

        notificationRepo.deleteByRecipient(
                employee
        );
    }

    /*
     * Security check for operations where
     * the notification object has already
     * been loaded.
     */
    private void verifyOwnership(
            Notification notification,
            Employee employee) {

        if (
                notification.getRecipient() == null
                        ||
                employee == null
                        ||
                !notification.getRecipient()
                        .getId()
                        .equals(employee.getId())
        ) {

            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have permission to modify this notification"
            );
        }
    }

    /*
     * Convert entity to response DTO.
     */
    private NotificationDTOs.Response toResponse(
            Notification n) {

        NotificationDTOs.Response r =
                new NotificationDTOs.Response();

        r.setId(n.getId());
        r.setTitle(n.getTitle());
        r.setMessage(n.getMessage());
        r.setType(n.getType());
        r.setReferenceType(n.getReferenceType());
        r.setReferenceId(n.getReferenceId());
        r.setRead(n.isRead());
        r.setCreatedAt(n.getCreatedAt());

        return r;
    }
}