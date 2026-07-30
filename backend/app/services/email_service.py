"""
Email service for BRET Assessment.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@bret.app")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_reset_email(to_email: str, raw_token: str) -> None:
    """
    Send a password-reset email to `to_email`. In dev mode (SMTP_HOST empty),
    logs the link to stdout instead.
    """
    reset_url = f"{FRONTEND_URL}/reset-password?token={raw_token}"

    if not SMTP_HOST:
        print(f"\n[DEV] Password reset link for {to_email}:\n  {reset_url}\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "BRET — Reset your password"
    msg["From"] = MAIL_FROM
    msg["To"] = to_email

    text_body = (
        f"You requested a password reset for your BRET account.\n\n"
        f"Click the link below to set a new password (valid for 1 hour):\n\n"
        f"{reset_url}\n\n"
        f"If you didn't request this, you can safely ignore this email.\n"
    )

    html_body = f"""
    <html><body>
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for your BRET account ({to_email}).</p>
      <p>Click the link below to choose a new password (valid for 1 hour):</p>
      <a href="{reset_url}">Reset password</a>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p>{reset_url}</p>
    </body></html>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.sendmail(MAIL_FROM, to_email, msg.as_string())
