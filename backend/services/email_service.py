import resend
import os

resend.api_key = os.getenv("RESEND_API_KEY")

def send_email(to: str, subject: str, html: str):
    return resend.Emails.send({
        "from": "onboarding@resend.dev",  # change later
        "to": [to],
        "subject": subject,
        "html": html,
    })