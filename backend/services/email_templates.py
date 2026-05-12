import os
from html import escape


BRAND_BLUE = "#223f59"
BRAND_NAME = os.getenv("EMAIL_BRAND_NAME", "Portuguese Learning Academy")
LOGO_URL = os.getenv("EMAIL_LOGO_URL", "http://localhost:5173/src/assets/logo.webp").strip()


def _render_layout(title: str, body_html: str):
        logo_section = ""
        if LOGO_URL:
                logo_section = (
                        f'<img src="{escape(LOGO_URL)}" alt="{escape(BRAND_NAME)}" '
                        'style="display:block; max-height:42px; width:auto;">'
                )
        else:
                logo_section = (
                        f'<span style="color:#ffffff; font-size:18px; font-weight:800; '
                    'font-family:Arial, sans-serif;">'
                    f"{escape(BRAND_NAME)}</span>"
                )

        return f"""
        <div style="margin:0; padding:24px 12px; background-color:#f4f7fb;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:0 auto; border-collapse:collapse; background:#ffffff; border:1px solid #d8e0ea; border-radius:12px; overflow:hidden;">
                <tr>
                    <td style="background:{BRAND_BLUE}; padding:18px 22px;">{logo_section}</td>
                </tr>
                <tr>
                      <td style="padding:24px 22px 12px 22px; color:#223f59; font-family:Arial, sans-serif;">
                        <h1 style="margin:0 0 12px 0; font-size:24px; line-height:1.3; color:#223f59; font-family:Arial, sans-serif;">{escape(title)}</h1>
                        <div style="font-size:15px; line-height:1.65; color:#223f59;">{body_html}</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding:14px 22px 20px 22px; color:#6d7f94; font-family:Arial, sans-serif; font-size:12px;">
                        {escape(BRAND_NAME)}
                    </td>
                </tr>
            </table>
        </div>
        """


def registration_email(name: str):
        safe_name = escape(name)
        return _render_layout(
                "Welcome!",
                f"<p style='margin:0;'>Welcome {safe_name}! Your account has been created successfully.</p>",
        )


def enrollment_email(name: str, course: str):
    safe_name = escape(name)
    safe_course = escape(course)
    return _render_layout(
        "Enrollment Confirmed",
        f"<p style='margin:0;'>Hello {safe_name}, you are enrolled in <strong>{safe_course}</strong>.</p>",
    )


def waitlist_email(name: str):
    safe_name = escape(name)
    return _render_layout(
        "You're on the Waitlist",
        f"<p style='margin:0;'>Hello {safe_name}, we will notify you when a spot opens.</p>",
    )


def payment_email(name: str, amount: float):
    safe_name = escape(name)
    return _render_layout(
        "Payment Confirmed",
        f"<p style='margin:0;'>Hello {safe_name}, your payment of <strong>EUR {amount:.2f}</strong> was confirmed.</p>",
    )


def activity_email(message: str):
    safe_message = escape(message).replace("\n", "<br>")
    return _render_layout(
        "New Notification",
        f"<p style='margin:0;'>{safe_message}</p>",
    )


def verification_email(token: str):
    verify_url = f"http://localhost:5173/verify?token={escape(token)}"
    return _render_layout(
        "Verify Your Email",
        (
            "<p style='margin:0 0 12px 0;'>Please verify your email address to continue.</p>"
            f"<a href=\"{verify_url}\" style=\"display:inline-block; padding:10px 14px; background:{BRAND_BLUE}; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:700;\">"
            "Verify Email"
            "</a>"
        ),
    )


def custom_message_email(subject: str, message: str):
    safe_message = escape(message).replace("\n", "<br>")
    return _render_layout(subject, f"<p style='margin:0;'>{safe_message}</p>")


def registration_email_template(name: str):
    return registration_email(name)


def payment_confirmation(name: str, amount: float):
    return payment_email(name, amount)


def enrollment_confirmation(name: str, course: str):
    return enrollment_email(name, course)


def waitlist_confirmation(name: str):
    return waitlist_email(name)


def email_verification(token: str):
    return verification_email(token)