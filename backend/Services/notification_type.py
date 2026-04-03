from enum import Enum

class NotificationType(str, Enum):
    REGISTRATION = "registration"
    ENROLLMENT = "enrollment"
    WAITLIST = "waitlist"
    PAYMENT = "payment"
    ACTIVITY = "activity"
    EMAIL_VERIFICATION = "email_verification"