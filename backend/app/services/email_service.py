"""
Email service for BRET Assessment.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from app.auth import JWT_SECRET_KEY, JWT_ALGORITHM  # reuse values
from jose import jwt as jose_jwt

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

from email.mime.application import MIMEApplication

def send_report_email_with_pdf(to_email: str, user_name: str, session_id: int, pdf_bytes: bytes) -> None:
    """
    Send the completed assessment report link to the candidate, along with the PDF attached.
    In dev mode (SMTP_HOST empty), logs to stdout.
    """
    payload = {
        "session_id": session_id,
        "exp": datetime.utcnow() + timedelta(minutes=REPORT_TOKEN_EXPIRE_MINUTES),
        "purpose": "report_access",
    }
    report_token = jose_jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    report_url = f"{FRONTEND_URL}/sessions/{session_id}/report?report_token={report_token}"
    
    
    if not SMTP_HOST:
        print(f"\n[DEV] Report link for {to_email} ({user_name}):\n  {report_url}\n  (PDF attachment generated, size: {len(pdf_bytes)} bytes)\n")
        return
        
    msg = MIMEMultipart("mixed")
    msg["Subject"] = "Your BRET Assessment Report"
    msg["From"] = MAIL_FROM
    msg["To"] = to_email

    # We create an 'alternative' part for the text/html content
    body_part = MIMEMultipart("alternative")

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

    body_part.attach(MIMEText(text_body, "plain"))
    body_part.attach(MIMEText(html_body, "html"))
    msg.attach(body_part)

    if pdf_bytes:
        pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        pdf_attachment.add_header('Content-Disposition', 'attachment', filename='BRET-Report.pdf')
        msg.attach(pdf_attachment)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.sendmail(MAIL_FROM, to_email, msg.as_string())


async def send_single_use_invitation_email(email: str, password: str, name: str):
    """Send single-use account invitation with auto-generated password."""
    subject = "Your Assessment Invitation"
    
    html_content = f"""
    <html>
        <body>
            <h2>Welcome to your assessment</h2>
            <p>Hi {name},</p>
            <p>Your account has been created for a one-time assessment.</p>
            <h3>Login Details:</h3>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Password:</strong> {password}</p>
            <p><a href="http://your-domain/login">Click here to login</a></p>
            <p><strong>Important:</strong> This password is shown only this one time. After you complete your assessment, this account will be automatically deleted.</p>
        </body>
    </html>
    """
    
    await send_email(email=email, subject=subject, html_content=html_content)