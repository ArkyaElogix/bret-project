"""
Email service for BRET Assessment.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from app.auth import JWT_SECRET_KEY, JWT_ALGORITHM  # reuse values
import jwt as pyjwt

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@bret.app")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

REPORT_TOKEN_EXPIRE_MINUTES = int(os.getenv("REPORT_TOKEN_EXPIRE_MINUTES", "720"))

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

def send_report_email(to_email: str, user_name: str, session_id: int) -> None:
    """
    Send the completed assessment report link to the candidate.
    In dev mode (SMTP_HOST empty), logs to stdout.
    """
    payload = {
        "session_id": session_id,
        "exp": datetime.utcnow() + timedelta(minutes=REPORT_TOKEN_EXPIRE_MINUTES),
        "purpose": "report_access",
    }
    report_token = pyjwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    report_url = f"{FRONTEND_URL}/sessions/{session_id}/report?report_token={report_token}"
    
    
    if not SMTP_HOST:
        print(f"\n[DEV] Report link for {to_email} ({user_name}):\n  {report_url}\n")
        return
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your BRET Assessment Report"
    msg["From"] = MAIL_FROM
    msg["To"] = to_email

    text_body = (
        f"Hello {user_name},\n\n"
        f"Thank you for completing the BRET Assessment. Your customized report is ready.\n\n"
        f"You can view your full report by clicking the link below. Please note this link "
        f"will expire in 12 hours, so we recommend you save or print the report for your records:\n\n"
        f"{report_url}\n\n"
    )

    html_body = f"""
    <html><body>
      <h2>Your Assessment Report is Ready</h2>
      <p>Hello {user_name},</p>
      <p>Thank you for completing the BRET Assessment. You can view your customized report below.</p>
      <p><strong>Note:</strong> Your account access to this link will expire in 12 hours. We recommend you use your browser's "Print to PDF" feature to save a permanent copy.</p>
      <br>
      <a href="{report_url}">View My Report</a>
      <br><br>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p>{report_url}</p>
    </body></html>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.sendmail(MAIL_FROM, to_email, msg.as_string())
    