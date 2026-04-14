from Services.notification_type import NotificationType
from Services.email_template import (
    registration_email,
    enrollment_email,
    waitlist_email,
    payment_email,
    activity_email,
    verification_email
)
from Services.email_service import send_email

def send_notification_email(notification_type: NotificationType, to: str, data:dict):
    if notification_type == NotificationType.REGISTRATION:
        html = registration_email(data["name"])
        subject = "Welcome to the platform ??"

    elif notification_type == NotificationType.ENROLLMENT:
        html = enrollment_email(data["name"], data["course"])
        subject = "Enrollment Confirmed"

    elif notification_type == NotificationType.WAITLIST:
        html = waitlist_email(data["name"])
        subject = "Waitlist Confirmation"

    elif notification_type == NotificationType.PAYMENT:
        html = payment_email(data["name"], data["amount"])
        subject = "Payment Confirmation"

    elif notification_type == NotificationType.ACTIVITY:
        html = activity_email(data["message"])
        subject = "New Notification"

    elif notification_type == NotificationType.EMAIL_VERIFICATION:
        html = verification_email(data["token"])
        subject = "Verify Your Email"

    else:
        raise ValueError("Invalid notification type")

    return send_email(to, subject, html)