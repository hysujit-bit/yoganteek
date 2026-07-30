from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import psycopg2
import os
import smtplib
import json
from datetime import datetime, date, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Google Calendar API
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    GOOGLE_CALENDAR_AVAILABLE = True
except ImportError:
    GOOGLE_CALENDAR_AVAILABLE = False
    print("[WARN] google-api-python-client not installed. Google Calendar sync disabled.")

app = FastAPI(title="Yoganteek API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use environment variable for DB URL (set in Render)
DB_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/Yoganteek?sslmode=require'
)

# Email config (set via environment variables on Render)
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', 'yoganteekwellness@gmail.com')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'yoganteekwellness@gmail.com')
FROM_NAME = os.environ.get('FROM_NAME', 'Yoganteek Wellness')

# Google Calendar config (set via environment variables on Render)
GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID', 'yoganteekwellness@gmail.com')
GOOGLE_SERVICE_ACCOUNT_JSON = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON', '')


# ─────────────────────────────────────────────
# PYDANTIC MODELS — Existing
# ─────────────────────────────────────────────

class LeadCreate(BaseModel):
    name: str
    email: str
    phone: str
    health_goal: Optional[str] = None
    concern: Optional[str] = None
    message: Optional[str] = None
    calendly_url: Optional[str] = None


class ContactSubmissionCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str


class CorporateInquiryCreate(BaseModel):
    company_name: str
    contact_name: str
    email: str
    phone: str
    employee_count: Optional[str] = None
    preferred_program: Optional[str] = None
    preferred_schedule: Optional[str] = None
    industry: Optional[str] = None
    message: Optional[str] = None


# ─────────────────────────────────────────────
# PYDANTIC MODELS — Ops Dashboard
# ─────────────────────────────────────────────

class LeadStatusUpdate(BaseModel):
    """Update ops fields on any lead source."""
    status: Optional[str] = None          # new | contacted | consultation_booked | converted | not_interested
    coordinator: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None  # YYYY-MM-DD


class PatientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None   # YYYY-MM-DD
    gender: Optional[str] = None
    health_goals: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    coordinator: Optional[str] = None
    source: Optional[str] = None          # 'lead' | 'corporate' | 'manual'
    lead_id: Optional[int] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    health_goals: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    coordinator: Optional[str] = None
    status: Optional[str] = None          # active | paused | completed


class SharePatientBriefRequest(BaseModel):
    to_email: str
    to_name: Optional[str] = "Team Member"


class SessionCreate(BaseModel):
    patient_id: Optional[int] = None
    patient_name: str
    patient_email: Optional[str] = None
    session_date: str                      # YYYY-MM-DD
    session_time: str                      # HH:MM
    duration_minutes: Optional[int] = 30
    session_type: Optional[str] = None    # initial | follow-up | group | corporate
    meeting_link: Optional[str] = None
    coordinator: Optional[str] = None


class SessionUpdate(BaseModel):
    status: Optional[str] = None          # scheduled | completed | cancelled | no-show
    notes: Optional[str] = None
    meeting_link: Optional[str] = None
    session_date: Optional[str] = None
    session_time: Optional[str] = None
    coordinator: Optional[str] = None


class CalendlyBookingRequest(BaseModel):
    """Auto-capture booking from Calendly redirect URL params."""
    name: str
    email: str
    start_time: str                        # ISO 8601 with timezone
    end_time: Optional[str] = None
    event_type: Optional[str] = "Free Consultation"


class LogConsultationRequest(BaseModel):
    """Manual consultation logging from Ops Dashboard (fallback)."""
    lead_id: int
    session_date: str                      # YYYY-MM-DD
    session_time: str                      # HH:MM
    meeting_link: Optional[str] = None
    session_type: Optional[str] = "Free Consultation"


class ShareSessionRequest(BaseModel):
    prep_instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    patient_id: Optional[int] = None
    patient_name: str
    patient_email: Optional[str] = None
    title: Optional[str] = None
    created_by: Optional[str] = None
    yoga_routine: Optional[List[Any]] = None        # [{pose, duration, notes}]
    breathing_exercises: Optional[List[Any]] = None # [{name, reps, notes}]
    nutrition_plan: Optional[List[Any]] = None      # [{meal, items, notes}]
    lifestyle_tips: Optional[str] = None
    additional_notes: Optional[str] = None


class PatientPlanCreate(BaseModel):
    patient_id: Optional[int] = None
    service_name: str
    plan_type: Optional[str] = None       # individual | corporate
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    sessions_total: Optional[int] = None
    sessions_completed: Optional[int] = 0
    amount_paid: Optional[float] = None
    payment_status: Optional[str] = 'pending'  # pending | partial | paid
    coordinator: Optional[str] = None
    notes: Optional[str] = None


class BookingCreate(BaseModel):
    """Create a new public booking (from booking page)."""
    patient_name: str
    patient_email: str
    patient_phone: Optional[str] = None
    health_goal: Optional[str] = None
    booking_date: str                      # YYYY-MM-DD
    booking_time: str                      # HH:MM


class BookingUpdate(BaseModel):
    """Update a booking (from Ops Dashboard)."""
    status: Optional[str] = None           # confirmed | cancelled | completed | rescheduled
    booking_date: Optional[str] = None
    booking_time: Optional[str] = None
    meeting_link: Optional[str] = None
    assigned_doctor: Optional[str] = None
    notes: Optional[str] = None


# ─────────────────────────────────────────────
# DATABASE HELPER
# ─────────────────────────────────────────────

def get_db():
    return psycopg2.connect(DB_URL)


# ─────────────────────────────────────────────
# EMAIL HELPERS
# ─────────────────────────────────────────────

def send_email(to_email: str, to_name: str, subject: str, html_body: str):
    """Send an email using SMTP. Returns True on success, False on failure."""
    if not SMTP_PASS:
        print("[EMAIL] SMTP_PASS not set, skipping email send")
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_body, 'html'))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL] Sent to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")
        return False


def _email_wrapper(content: str) -> str:
    """Shared branded email wrapper — Yoganteek design system."""
    return f"""
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px;background:#FAF8F5;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#3D4F35;margin:0;">
          Yoganteek Wellness
        </h1>
        <p style="font-size:12px;color:#888;margin-top:4px;">Dr. Jayashree Pattanaik</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid rgba(0,0,0,.06);">
        {content}
      </div>
      <div style="text-align:center;margin-top:24px;">
        <p style="font-size:11px;color:#aaa;">&copy; 2026 Yoganteek Wellness. All rights reserved.</p>
      </div>
    </div>
    """


def build_lead_acknowledgement(name: str) -> str:
    content = f"""
    <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#3D4F35;margin:0 0 12px;">
      Thank You, {name}!
    </h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
      We've received your inquiry and our team will get back to you within <strong>24 hours</strong>.
    </p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
      In the meantime, feel free to reach out at
      <a href="mailto:yoganteekwellness@gmail.com" style="color:#7A8B6F;">yoganteekwellness@gmail.com</a>
      or call <a href="tel:7978311312" style="color:#7A8B6F;">+91 797 831 1312</a>.
    </p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Namaste! &#x1F64F;</p>
    """
    return _email_wrapper(content)


def build_corporate_acknowledgement(contact_name: str, company_name: str) -> str:
    content = f"""
    <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#3D4F35;margin:0 0 12px;">
      Thank You, {contact_name}!
    </h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
      We've received your corporate wellness inquiry for <strong>{company_name}</strong>.
    </p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
      Our team is preparing a customized proposal. You can expect to hear from us within <strong>24 hours</strong>.
    </p>
    <div style="background:#F4F6F2;border-radius:12px;padding:20px;margin:0 0 16px;">
      <p style="font-size:13px;color:#3D4F35;margin:0;font-weight:600;">What happens next?</p>
      <ul style="font-size:13px;color:#555;line-height:1.8;margin:8px 0 0;padding-left:20px;">
        <li>We review your requirements</li>
        <li>Design a customized wellness program</li>
        <li>Share a detailed proposal with pricing</li>
        <li>Schedule a call to discuss details</li>
      </ul>
    </div>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Namaste! &#x1F64F;</p>
    """
    return _email_wrapper(content)


def build_contact_acknowledgement(name: str, subject: str) -> str:
    content = f"""
    <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#3D4F35;margin:0 0 12px;">
      Thank You, {name}!
    </h2>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
      We've received your message regarding <strong>{subject}</strong>.
      Our team will get back to you within <strong>24 hours</strong>.
    </p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Namaste! &#x1F64F;</p>
    """
    return _email_wrapper(content)


def build_session_share_email(patient_name: str, session_date: str, session_time: str,
                               duration: int, meeting_link: str, coordinator: str,
                               prep_instructions: str = None) -> str:
    """Branded email sent to patient when team shares session/call details."""
    meet_btn = ""
    if meeting_link:
        meet_btn = f"""
        <div style="text-align:center;margin:24px 0;">
          <a href="{meeting_link}"
             style="background:#3D4F35;color:#fff;text-decoration:none;padding:14px 32px;
                    border-radius:30px;font-size:15px;font-weight:600;display:inline-block;">
            &#x1F4F9; Join Your Consultation
          </a>
          <p style="font-size:11px;color:#aaa;margin-top:8px;word-break:break-all;">{meeting_link}</p>
        </div>
        """

    prep_block = ""
    if prep_instructions:
        prep_block = f"""
        <div style="background:#F4F6F2;border-radius:12px;padding:20px;margin:0 0 20px;">
          <p style="font-size:13px;color:#3D4F35;font-weight:600;margin:0 0 8px;">
            &#x1F4DD; Preparation Instructions
          </p>
          <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">{prep_instructions}</p>
        </div>
        """

    content = f"""
    <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#3D4F35;margin:0 0 6px;">
      Your Session is Confirmed, {patient_name}!
    </h2>
    <p style="font-size:14px;color:#888;margin:0 0 24px;">Here are your consultation details.</p>

    <div style="background:#F4F6F2;border-radius:12px;padding:20px;margin:0 0 20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#888;width:38%;">&#x1F4C5; Date</td>
          <td style="padding:7px 0;font-size:13px;color:#333;font-weight:600;">{session_date}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#888;">&#x23F0; Time</td>
          <td style="padding:7px 0;font-size:13px;color:#333;font-weight:600;">{session_time}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#888;">&#x23F1; Duration</td>
          <td style="padding:7px 0;font-size:13px;color:#333;font-weight:600;">{duration} minutes</td>
        </tr>
        <tr>
          <td style="padding:7px 0;font-size:13px;color:#888;">&#x1F468;&#x200D;&#x2695;&#xFE0F; With</td>
          <td style="padding:7px 0;font-size:13px;color:#333;font-weight:600;">
            {coordinator or 'Dr. Jayashree Pattanaik'}
          </td>
        </tr>
      </table>
    </div>

    {meet_btn}
    {prep_block}

    <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">
      Questions? Contact us at
      <a href="mailto:yoganteekwellness@gmail.com" style="color:#7A8B6F;">yoganteekwellness@gmail.com</a>
      or <a href="tel:7978311312" style="color:#7A8B6F;">+91 797 831 1312</a>.
    </p>
    <p style="font-size:14px;color:#555;margin-top:16px;">Namaste! &#x1F64F;</p>
    """
    return _email_wrapper(content)


def build_session_reminder_email(patient_name: str, session_date: str, session_time: str,
                                  meeting_link: str, hours_before: int) -> str:
    """Auto-sent reminder 24h and 1h before session."""
    urgency_label = "Tomorrow" if hours_before == 24 else "In 1 Hour"
    banner_color = "#C4A265" if hours_before == 24 else "#c0442b"

    meet_btn = ""
    if meeting_link:
        meet_btn = f"""
        <div style="text-align:center;margin:20px 0;">
          <a href="{meeting_link}"
             style="background:#3D4F35;color:#fff;text-decoration:none;padding:14px 32px;
                    border-radius:30px;font-size:15px;font-weight:600;display:inline-block;">
            &#x1F4F9; Join Consultation
          </a>
        </div>
        """

    content = f"""
    <div style="background:{banner_color};border-radius:8px;padding:12px 20px;margin:0 0 20px;text-align:center;">
      <p style="color:#fff;font-weight:600;margin:0;font-size:14px;">
        &#x23F0; Reminder: Your Session is {urgency_label}
      </p>
    </div>
    <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#3D4F35;margin:0 0 16px;">
      Hi {patient_name}, your wellness session is coming up!
    </h2>
    <p style="font-size:14px;color:#555;margin:0 0 4px;"><strong>Date:</strong> {session_date}</p>
    <p style="font-size:14px;color:#555;margin:0 0 20px;"><strong>Time:</strong> {session_time}</p>
    {meet_btn}
    <p style="font-size:13px;color:#888;margin:0;">Namaste! &#x1F64F;</p>
    """
    return _email_wrapper(content)


def build_prescription_email(patient_name: str, title: str, yoga_routine: list,
                              breathing_exercises: list, nutrition_plan: list,
                              lifestyle_tips: str, additional_notes: str,
                              created_by: str) -> str:
    """Formatted care plan email sent to patient."""

    def _table_section(heading: str, emoji: str, items: list, fields: list) -> str:
        if not items:
            return ""
        headers = "".join(
            f"<th style='text-align:left;padding:8px 12px;font-size:12px;color:#7A8B6F;"
            f"font-weight:600;text-transform:uppercase;letter-spacing:.5px;'>"
            f"{f.replace('_',' ').title()}</th>"
            for f in fields
        )
        rows = "".join(
            "<tr>" + "".join(
                f"<td style='padding:8px 12px;font-size:13px;color:#555;"
                f"border-bottom:1px solid #f0ece6;'>{item.get(f, '—')}</td>"
                for f in fields
            ) + "</tr>"
            for item in items
        )
        return f"""
        <div style="margin:0 0 20px;">
          <p style="font-size:15px;font-weight:600;color:#3D4F35;margin:0 0 10px;">{emoji} {heading}</p>
          <table style="width:100%;border-collapse:collapse;background:#F9F7F4;border-radius:8px;overflow:hidden;">
            <thead><tr style="background:#E8EDE4;">{headers}</tr></thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
        """

    yoga_sec = _table_section("Yoga Routine", "&#x1F9D8;", yoga_routine or [], ["pose", "duration", "notes"])
    breath_sec = _table_section("Breathing Exercises", "&#x1F32C;", breathing_exercises or [], ["name", "reps", "notes"])
    nutrition_sec = _table_section("Nutrition Plan", "&#x1F957;", nutrition_plan or [], ["meal", "items", "notes"])

    lifestyle_block = ""
    if lifestyle_tips:
        lifestyle_block = f"""
        <div style="background:#F4F6F2;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
          <p style="font-size:15px;font-weight:600;color:#3D4F35;margin:0 0 8px;">&#x1F33F; Lifestyle Tips</p>
          <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">{lifestyle_tips}</p>
        </div>
        """

    notes_block = ""
    if additional_notes:
        notes_block = f"""
        <div style="background:#FFF9EE;border-radius:12px;padding:16px 20px;margin:0 0 20px;
                    border-left:4px solid #C4A265;">
          <p style="font-size:15px;font-weight:600;color:#3D4F35;margin:0 0 8px;">&#x1F4DD; Additional Notes</p>
          <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">{additional_notes}</p>
        </div>
        """

    content = f"""
    <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#3D4F35;margin:0 0 4px;">
      Your Wellness Care Plan
    </h2>
    <p style="font-size:13px;color:#888;margin:0 0 24px;">
      Prepared for <strong>{patient_name}</strong> by {created_by or 'Dr. Jayashree Pattanaik'}
    </p>
    <h3 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#3D4F35;
               margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #E8EDE4;">
      {title or 'Personalised Wellness Plan'}
    </h3>
    {yoga_sec}{breath_sec}{nutrition_sec}{lifestyle_block}{notes_block}
    <p style="font-size:13px;color:#555;line-height:1.7;margin:16px 0 0;">
      For queries: <a href="mailto:yoganteekwellness@gmail.com" style="color:#7A8B6F;">
      yoganteekwellness@gmail.com</a>
    </p>
    <p style="font-size:14px;color:#555;margin-top:12px;">Namaste! &#x1F64F;</p>
    """
    return _email_wrapper(content)


def build_patient_brief_email(patient: dict, upcoming_session: dict = None,
                               active_plan: dict = None) -> str:
    """Internal patient brief emailed to a team member before consultation."""
    session_block = ""
    if upcoming_session:
        link_html = (
            f"<a href='{upcoming_session.get('meeting_link')}' style='font-size:12px;color:#7A8B6F;'>"
            f"Join Link &#x2192;</a>"
            if upcoming_session.get('meeting_link') else ""
        )
        session_block = f"""
        <div style="background:#E8EDE4;border-radius:10px;padding:16px;margin:0 0 16px;">
          <p style="font-size:13px;font-weight:600;color:#3D4F35;margin:0 0 6px;">
            &#x1F4C5; Upcoming Session
          </p>
          <p style="font-size:13px;color:#555;margin:0 0 4px;">
            {upcoming_session.get('session_date','')} at {upcoming_session.get('session_time','')}
          </p>
          {link_html}
        </div>
        """

    plan_block = ""
    if active_plan:
        done = active_plan.get('sessions_completed', 0)
        total = active_plan.get('sessions_total', 0)
        pct = int((done / total * 100)) if total else 0
        plan_block = f"""
        <div style="background:#FFF9EE;border-radius:10px;padding:16px;margin:0 0 16px;">
          <p style="font-size:13px;font-weight:600;color:#3D4F35;margin:0 0 6px;">
            &#x1F4E6; Active Plan: {active_plan.get('service_name','')}
          </p>
          <p style="font-size:13px;color:#555;margin:0 0 8px;">
            {done}/{total} sessions completed ({pct}%)
          </p>
          <div style="background:#E8EDE4;border-radius:4px;height:6px;">
            <div style="background:#7A8B6F;border-radius:4px;height:6px;width:{pct}%;"></div>
          </div>
        </div>
        """

    goals_block = ""
    if patient.get('health_goals'):
        goals_block = f"""
        <div style="background:#F4F6F2;border-radius:10px;padding:16px;margin:0 0 16px;">
          <p style="font-size:13px;font-weight:600;color:#3D4F35;margin:0 0 6px;">
            &#x1F3AF; Health Goals
          </p>
          <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">{patient['health_goals']}</p>
        </div>
        """

    history_block = ""
    if patient.get('medical_history'):
        history_block = f"""
        <div style="background:#FFF9EE;border-radius:10px;padding:16px;margin:0 0 16px;">
          <p style="font-size:13px;font-weight:600;color:#3D4F35;margin:0 0 6px;">
            &#x1F3E5; Medical History
          </p>
          <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">{patient['medical_history']}</p>
        </div>
        """

    content = f"""
    <div style="background:#3D4F35;border-radius:10px;padding:16px 20px;margin:0 0 20px;">
      <p style="color:#E8EDE4;font-size:10px;font-weight:600;letter-spacing:1.5px;
                text-transform:uppercase;margin:0 0 4px;">INTERNAL PATIENT BRIEF</p>
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#fff;margin:0;">
        {patient.get('name','')}
      </h2>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#888;width:35%;">&#x1F4E7; Email</td>
        <td style="padding:6px 0;font-size:13px;color:#333;">{patient.get('email','—')}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#888;">&#x1F4DE; Phone</td>
        <td style="padding:6px 0;font-size:13px;color:#333;">{patient.get('phone','—')}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#888;">&#x1F464; Coordinator</td>
        <td style="padding:6px 0;font-size:13px;color:#333;">{patient.get('coordinator','—')}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#888;">&#x1F4CA; Status</td>
        <td style="padding:6px 0;font-size:13px;color:#333;">{patient.get('status','active').title()}</td>
      </tr>
    </table>

    {goals_block}{history_block}{session_block}{plan_block}

    <p style="font-size:12px;color:#aaa;margin:16px 0 0;border-top:1px solid #f0ece6;padding-top:12px;">
      &#x26A0;&#xFE0F; This brief is for <strong>internal use only</strong>. Do not forward to the patient.
    </p>
    """
    return _email_wrapper(content)


# ─────────────────────────────────────────────
# GOOGLE CALENDAR HELPER
# ─────────────────────────────────────────────

def get_google_calendar_service():
    """Build and return a Google Calendar API service object."""
    if not GOOGLE_CALENDAR_AVAILABLE:
        return None
    if not GOOGLE_SERVICE_ACCOUNT_JSON:
        print("[GOOGLE CAL] GOOGLE_SERVICE_ACCOUNT_JSON not set")
        return None
    try:
        creds_info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
        creds = service_account.Credentials.from_service_account_info(
            creds_info,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        service = build('calendar', 'v3', credentials=creds)
        return service
    except Exception as e:
        print(f"[GOOGLE CAL] Failed to build service: {e}")
        return None


def fetch_google_calendar_events(days_ahead: int = 7):
    """
    Fetch upcoming events from Google Calendar.
    Returns list of events with meeting links.
    """
    service = get_google_calendar_service()
    if not service:
        return []

    try:
        now = datetime.utcnow()
        time_max = now + timedelta(days=days_ahead)

        events_result = service.events().list(
            calendarId=GOOGLE_CALENDAR_ID,
            timeMin=now.isoformat() + 'Z',
            timeMax=time_max.isoformat() + 'Z',
            maxResults=50,
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        events = events_result.get('items', [])
        result = []
        for event in events:
            start = event.get('start', {})
            start_dt = start.get('dateTime', start.get('date', ''))
            end = event.get('end', {})
            end_dt = end.get('dateTime', end.get('date', ''))

            # Extract Google Meet link
            meeting_link = ''
            hangout_link = event.get('hangoutLink', '')
            if hangout_link:
                meeting_link = hangout_link
            else:
                # Check conference data for Meet link
                conference = event.get('conferenceData', {})
                entry_points = conference.get('entryPoints', [])
                for ep in entry_points:
                    if ep.get('entryPointType') == 'video':
                        meeting_link = ep.get('uri', '')
                        break

            result.append({
                'summary': event.get('summary', ''),
                'description': event.get('description', ''),
                'start': start_dt,
                'end': end_dt,
                'meeting_link': meeting_link,
                'attendees': [a.get('email', '') for a in event.get('attendees', [])],
                'google_event_id': event.get('id', ''),
            })

        return result
    except Exception as e:
        print(f"[GOOGLE CAL] Failed to fetch events: {e}")
        return []


def create_google_calendar_event(patient_name, patient_email, booking_date, booking_time, duration_minutes=30):
    """
    Create a Google Calendar event. Attempts to add Google Meet link.
    Returns dict with event_id and meeting_link, or None on failure.
    """
    service = get_google_calendar_service()
    if not service:
        print("[GOOGLE CAL] Cannot create event — service not available")
        return None

    try:
        # Parse date and time into datetime (IST = UTC+5:30)
        start_dt = datetime.strptime(f"{booking_date} {booking_time}", "%Y-%m-%d %H:%M")
        end_dt = start_dt + timedelta(minutes=duration_minutes)
        start_iso = start_dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")
        end_iso = end_dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")

        # Step 1: Create event WITHOUT conference data (always works)
        event_body = {
            'summary': f'Consultation - {patient_name}',
            'description': f'Free consultation booking for {patient_name}\nEmail: {patient_email}',
            'start': {
                'dateTime': start_iso,
                'timeZone': 'Asia/Kolkata',
            },
            'end': {
                'dateTime': end_iso,
                'timeZone': 'Asia/Kolkata',
            },
        }

        event = service.events().insert(
            calendarId=GOOGLE_CALENDAR_ID,
            body=event_body,
        ).execute()

        event_id = event.get('id', '')
        meeting_link = ''

        # Step 2: Try to patch with Google Meet conference
        try:
            patch_body = {
                'conferenceData': {
                    'createRequest': {
                        'requestId': f'booking-{booking_date}-{booking_time}-{event_id[:8]}',
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'},
                    }
                },
            }
            updated = service.events().patch(
                calendarId=GOOGLE_CALENDAR_ID,
                eventId=event_id,
                body=patch_body,
                conferenceDataVersion=1,
            ).execute()

            meeting_link = updated.get('hangoutLink', '')
            if not meeting_link:
                conference = updated.get('conferenceData', {})
                entry_points = conference.get('entryPoints', [])
                for ep in entry_points:
                    if ep.get('entryPointType') == 'video':
                        meeting_link = ep.get('uri', '')
                        break
            print(f"[GOOGLE CAL] Meet link added: {meeting_link}")
        except Exception as meet_err:
            print(f"[GOOGLE CAL] Could not add Meet link (event still created): {meet_err}")

        print(f"[GOOGLE CAL] Event created: {event_id} | Meeting: {meeting_link}")
        return {'event_id': event_id, 'meeting_link': meeting_link}

    except Exception as e:
        print(f"[GOOGLE CAL] Failed to create event: {e}")
        return None


# ─────────────────────────────────────────────
# DB TABLE SETUP — Existing tables
# ─────────────────────────────────────────────

def ensure_leads_table():
    """Create leads table if it doesn't exist."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                health_goal VARCHAR(100),
                concern VARCHAR(100),
                message TEXT,
                calendly_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] leads table ready")
    except Exception as e:
        print(f"[DB] Error ensuring leads table: {e}")


def ensure_corporate_table():
    """Create corporate_inquiries table if it doesn't exist."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS corporate_inquiries (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                employee_count VARCHAR(50),
                preferred_program VARCHAR(100),
                preferred_schedule VARCHAR(50),
                industry VARCHAR(100),
                message TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] corporate_inquiries table ready")
    except Exception as e:
        print(f"[DB] Error ensuring corporate_inquiries table: {e}")


def ensure_contact_submissions_table():
    """Create contact_submissions table if it doesn't exist."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                subject VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                source VARCHAR(100) DEFAULT 'contact-page',
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] contact_submissions table ready")
    except Exception as e:
        print(f"[DB] Error ensuring contact_submissions table: {e}")


# ─────────────────────────────────────────────
# DB TABLE SETUP — New Ops tables
# ─────────────────────────────────────────────

def ensure_ops_columns():
    """Add ops tracking columns to existing lead tables (idempotent via IF NOT EXISTS)."""
    ops_cols = [
        ("leads", "status", "VARCHAR(50) DEFAULT 'new'"),
        ("leads", "coordinator", "VARCHAR(100)"),
        ("leads", "notes", "TEXT"),
        ("leads", "follow_up_date", "DATE"),
        ("contact_submissions", "status", "VARCHAR(50) DEFAULT 'new'"),
        ("contact_submissions", "coordinator", "VARCHAR(100)"),
        ("contact_submissions", "notes", "TEXT"),
        ("contact_submissions", "follow_up_date", "DATE"),
        ("corporate_inquiries", "status", "VARCHAR(50) DEFAULT 'new'"),
        ("corporate_inquiries", "coordinator", "VARCHAR(100)"),
        ("corporate_inquiries", "notes", "TEXT"),
        ("corporate_inquiries", "follow_up_date", "DATE"),
    ]
    try:
        conn = get_db(); cur = conn.cursor()
        for table, col, col_type in ops_cols:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}")
        conn.commit(); cur.close(); conn.close()
        print("[DB] Ops columns ready on lead tables")
    except Exception as e:
        print(f"[DB] Error ensuring ops columns: {e}")


def ensure_patients_table():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                date_of_birth DATE,
                gender VARCHAR(20),
                health_goals TEXT,
                medical_history TEXT,
                allergies TEXT,
                coordinator VARCHAR(100),
                status VARCHAR(50) DEFAULT 'active',
                source VARCHAR(50),
                lead_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] patients table ready")
    except Exception as e:
        print(f"[DB] Error ensuring patients table: {e}")


def ensure_sessions_table():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name VARCHAR(255),
                patient_email VARCHAR(255),
                session_date DATE NOT NULL,
                session_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 30,
                session_type VARCHAR(50),
                meeting_link TEXT,
                coordinator VARCHAR(100),
                status VARCHAR(50) DEFAULT 'scheduled',
                notes TEXT,
                reminder_24h_sent BOOLEAN DEFAULT FALSE,
                reminder_1h_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] sessions table ready")
    except Exception as e:
        print(f"[DB] Error ensuring sessions table: {e}")


def ensure_prescriptions_table():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS prescriptions (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name VARCHAR(255),
                patient_email VARCHAR(255),
                title VARCHAR(255),
                created_by VARCHAR(100),
                prescription_date DATE DEFAULT CURRENT_DATE,
                yoga_routine JSONB,
                breathing_exercises JSONB,
                nutrition_plan JSONB,
                lifestyle_tips TEXT,
                additional_notes TEXT,
                status VARCHAR(50) DEFAULT 'draft',
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] prescriptions table ready")
    except Exception as e:
        print(f"[DB] Error ensuring prescriptions table: {e}")


def ensure_patient_plans_table():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS patient_plans (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                service_name VARCHAR(255),
                plan_type VARCHAR(100),
                start_date DATE,
                end_date DATE,
                sessions_total INTEGER,
                sessions_completed INTEGER DEFAULT 0,
                amount_paid DECIMAL(10,2),
                payment_status VARCHAR(50) DEFAULT 'pending',
                coordinator VARCHAR(100),
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] patient_plans table ready")
    except Exception as e:
        print(f"[DB] Error ensuring patient_plans table: {e}")


def ensure_notifications_table():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                priority VARCHAR(20) DEFAULT 'medium',
                title VARCHAR(255) NOT NULL,
                message TEXT,
                related_id INTEGER,
                related_type VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup
                ON notifications (type, related_id, related_type)
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] notifications table ready")
    except Exception as e:
        print(f"[DB] Error ensuring notifications table: {e}")


def ensure_bookings_table():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                patient_name VARCHAR(255) NOT NULL,
                patient_email VARCHAR(255) NOT NULL,
                patient_phone VARCHAR(50),
                health_goal VARCHAR(255),
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 30,
                meeting_link TEXT,
                status VARCHAR(50) DEFAULT 'confirmed',
                assigned_doctor VARCHAR(255),
                notes TEXT,
                calendar_event_id TEXT,
                reminder_24h_sent BOOLEAN DEFAULT FALSE,
                reminder_1h_sent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit(); cur.close(); conn.close()
        print("[DB] bookings table ready")
    except Exception as e:
        print(f"[DB] Error ensuring bookings table: {e}")


# ─────────────────────────────────────────────
# STARTUP — Ensure all tables exist
# ─────────────────────────────────────────────

try:
    conn = get_db()
    conn.close()
    print("[DB] Database connection successful")
    ensure_leads_table()
    ensure_corporate_table()
    ensure_contact_submissions_table()
    ensure_ops_columns()
    ensure_patients_table()
    ensure_sessions_table()
    ensure_prescriptions_table()
    ensure_patient_plans_table()
    ensure_notifications_table()
    ensure_bookings_table()
except Exception as e:
    print(f"[DB] CRITICAL: Database connection failed on startup: {e}")


# ═══════════════════════════════════════════════════════════════
# API ROUTES — Existing (unchanged)
# ═══════════════════════════════════════════════════════════════

@app.post("/api/leads")
def create_lead(lead: LeadCreate):
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute(
            """INSERT INTO leads (name, email, phone, health_goal, concern, message, calendly_url)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (lead.name, lead.email, lead.phone, lead.health_goal,
             lead.concern, lead.message, lead.calendly_url)
        )
        lead_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        send_email(lead.email, lead.name,
                   "Thank you for your inquiry - Yoganteek Wellness",
                   build_lead_acknowledgement(lead.name))
        return {"success": True, "lead_id": lead_id, "message": "Lead saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/leads")
def get_leads():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT id, name, email, phone, health_goal, concern,
                   status, coordinator, notes, follow_up_date, created_at
            FROM leads ORDER BY created_at DESC
        """)
        rows = cur.fetchall(); cur.close(); conn.close()
        return {"leads": [
            {"id": r[0], "name": r[1], "email": r[2], "phone": r[3],
             "health_goal": r[4], "concern": r[5], "status": r[6] or "new",
             "coordinator": r[7], "notes": r[8],
             "follow_up_date": str(r[9]) if r[9] else None,
             "created_at": str(r[10]), "source": "website"}
            for r in rows
        ], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/corporate-inquiries")
def create_corporate_inquiry(inquiry: CorporateInquiryCreate):
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute(
            """INSERT INTO corporate_inquiries
               (company_name, contact_name, email, phone, employee_count,
                preferred_program, preferred_schedule, industry, message)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (inquiry.company_name, inquiry.contact_name, inquiry.email, inquiry.phone,
             inquiry.employee_count, inquiry.preferred_program, inquiry.preferred_schedule,
             inquiry.industry, inquiry.message)
        )
        inquiry_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        send_email(inquiry.email, inquiry.contact_name,
                   "Corporate Wellness Inquiry Received - Yoganteek Wellness",
                   build_corporate_acknowledgement(inquiry.contact_name, inquiry.company_name))
        return {"success": True, "inquiry_id": inquiry_id, "message": "Corporate inquiry saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/corporate-inquiries")
def get_corporate_inquiries():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT id, company_name, contact_name, email, phone, employee_count,
                   preferred_program, preferred_schedule, industry, message,
                   status, coordinator, notes, follow_up_date, created_at
            FROM corporate_inquiries ORDER BY created_at DESC
        """)
        rows = cur.fetchall(); cur.close(); conn.close()
        return {"inquiries": [
            {"id": r[0], "company_name": r[1], "contact_name": r[2], "email": r[3],
             "phone": r[4], "employee_count": r[5], "preferred_program": r[6],
             "preferred_schedule": r[7], "industry": r[8], "message": r[9],
             "status": r[10] or "new", "coordinator": r[11], "notes": r[12],
             "follow_up_date": str(r[13]) if r[13] else None,
             "created_at": str(r[14]), "source": "corporate"}
            for r in rows
        ], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/contact-submissions")
def create_contact_submission(submission: ContactSubmissionCreate):
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute(
            """INSERT INTO contact_submissions (name, email, phone, subject, message)
               VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (submission.name, submission.email, submission.phone,
             submission.subject, submission.message)
        )
        submission_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        send_email(submission.email, submission.name,
                   "Thank you for contacting us - Yoganteek Wellness",
                   build_contact_acknowledgement(submission.name, submission.subject))
        return {"success": True, "submission_id": submission_id,
                "message": "Contact submission saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contact-submissions")
def get_contact_submissions():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT id, name, email, phone, subject, message, source,
                   status, coordinator, notes, follow_up_date, created_at
            FROM contact_submissions ORDER BY created_at DESC
        """)
        rows = cur.fetchall(); cur.close(); conn.close()
        return {"submissions": [
            {"id": r[0], "name": r[1], "email": r[2], "phone": r[3],
             "subject": r[4], "message": r[5], "source": r[6] or "contact",
             "status": r[7] or "new", "coordinator": r[8], "notes": r[9],
             "follow_up_date": str(r[10]) if r[10] else None, "created_at": str(r[11])}
            for r in rows
        ], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# API ROUTES — Ops Dashboard (New)
# ═══════════════════════════════════════════════════════════════

# ── Lead Status Updates ──────────────────────────────────────

@app.put("/api/leads/{lead_id}/status")
def update_lead_status(lead_id: int, update: LeadStatusUpdate):
    """Update ops fields (status, coordinator, notes, follow_up_date) on a website lead."""
    try:
        conn = get_db(); cur = conn.cursor()
        fields, values = [], []
        if update.status is not None:
            fields.append("status = %s"); values.append(update.status)
        if update.coordinator is not None:
            fields.append("coordinator = %s"); values.append(update.coordinator)
        if update.notes is not None:
            fields.append("notes = %s"); values.append(update.notes)
        if update.follow_up_date is not None:
            fields.append("follow_up_date = %s"); values.append(update.follow_up_date)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        values.append(lead_id)
        cur.execute(f"UPDATE leads SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "Lead updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/corporate-inquiries/{inquiry_id}/status")
def update_corporate_status(inquiry_id: int, update: LeadStatusUpdate):
    """Update ops fields on a corporate inquiry."""
    try:
        conn = get_db(); cur = conn.cursor()
        fields, values = [], []
        if update.status is not None:
            fields.append("status = %s"); values.append(update.status)
        if update.coordinator is not None:
            fields.append("coordinator = %s"); values.append(update.coordinator)
        if update.notes is not None:
            fields.append("notes = %s"); values.append(update.notes)
        if update.follow_up_date is not None:
            fields.append("follow_up_date = %s"); values.append(update.follow_up_date)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        values.append(inquiry_id)
        cur.execute(f"UPDATE corporate_inquiries SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "Corporate inquiry updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/contact-submissions/{submission_id}/status")
def update_contact_status(submission_id: int, update: LeadStatusUpdate):
    """Update ops fields on a contact submission."""
    try:
        conn = get_db(); cur = conn.cursor()
        fields, values = [], []
        if update.status is not None:
            fields.append("status = %s"); values.append(update.status)
        if update.coordinator is not None:
            fields.append("coordinator = %s"); values.append(update.coordinator)
        if update.notes is not None:
            fields.append("notes = %s"); values.append(update.notes)
        if update.follow_up_date is not None:
            fields.append("follow_up_date = %s"); values.append(update.follow_up_date)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        values.append(submission_id)
        cur.execute(f"UPDATE contact_submissions SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "Submission updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Dashboard Stats ──────────────────────────────────────────

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    """Aggregated stats card data + today's sessions for the dashboard home."""
    try:
        conn = get_db(); cur = conn.cursor()
        today = date.today()

        # Open leads (all 3 sources, not yet contacted)
        cur.execute("SELECT COUNT(*) FROM leads WHERE status = 'new' OR status IS NULL")
        open_leads = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM contact_submissions WHERE status = 'new' OR status IS NULL")
        open_leads += cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM corporate_inquiries WHERE status = 'new' OR status IS NULL")
        open_leads += cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM patients WHERE status = 'active'")
        active_patients = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM sessions WHERE session_date = %s AND status = 'scheduled'", (today,))
        sessions_today = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) FROM leads
            WHERE follow_up_date <= %s AND status NOT IN ('converted','not_interested')
              AND follow_up_date IS NOT NULL
        """, (today,))
        follow_ups = cur.fetchone()[0]

        # Today's full session list
        cur.execute("""
            SELECT id, patient_name, session_date, session_time, duration_minutes,
                   session_type, meeting_link, coordinator, status
            FROM sessions WHERE session_date = %s AND status = 'scheduled'
            ORDER BY session_time
        """, (today,))
        today_sessions = [
            {"id": r[0], "patient_name": r[1], "session_date": str(r[2]),
             "session_time": str(r[3]), "duration_minutes": r[4],
             "session_type": r[5], "meeting_link": r[6],
             "coordinator": r[7], "status": r[8]}
            for r in cur.fetchall()
        ]

        # Lead pipeline breakdown
        cur.execute("SELECT status, COUNT(*) FROM leads WHERE status IS NOT NULL GROUP BY status")
        pipeline = {r[0]: r[1] for r in cur.fetchall()}

        cur.close(); conn.close()
        return {
            "open_leads": open_leads,
            "active_patients": active_patients,
            "sessions_today": sessions_today,
            "follow_ups_pending": follow_ups,
            "today_sessions": today_sessions,
            "pipeline": pipeline
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Patients ─────────────────────────────────────────────────

@app.post("/api/patients")
def create_patient(patient: PatientCreate):
    """Create a new patient record (optionally converted from a lead)."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            INSERT INTO patients (name, email, phone, date_of_birth, gender, health_goals,
                                  medical_history, allergies, coordinator, source, lead_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (patient.name, patient.email, patient.phone, patient.date_of_birth,
              patient.gender, patient.health_goals, patient.medical_history,
              patient.allergies, patient.coordinator, patient.source, patient.lead_id))
        patient_id = cur.fetchone()[0]

        # Auto-mark source lead as converted
        if patient.lead_id:
            cur.execute("UPDATE leads SET status = 'converted' WHERE id = %s", (patient.lead_id,))

        conn.commit(); cur.close(); conn.close()
        return {"success": True, "patient_id": patient_id, "message": "Patient created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/patients")
def get_patients():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT id, name, email, phone, gender, health_goals,
                   coordinator, status, created_at
            FROM patients ORDER BY created_at DESC
        """)
        rows = cur.fetchall(); cur.close(); conn.close()
        return {"patients": [
            {"id": r[0], "name": r[1], "email": r[2], "phone": r[3],
             "gender": r[4], "health_goals": r[5], "coordinator": r[6],
             "status": r[7], "created_at": str(r[8])}
            for r in rows
        ], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: int):
    """Full patient profile with linked sessions, plan, and prescriptions."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT id, name, email, phone, date_of_birth, gender, health_goals,
                   medical_history, allergies, coordinator, status, source, lead_id, created_at
            FROM patients WHERE id = %s
        """, (patient_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Patient not found")

        patient = {
            "id": r[0], "name": r[1], "email": r[2], "phone": r[3],
            "date_of_birth": str(r[4]) if r[4] else None, "gender": r[5],
            "health_goals": r[6], "medical_history": r[7], "allergies": r[8],
            "coordinator": r[9], "status": r[10], "source": r[11],
            "lead_id": r[12], "created_at": str(r[13])
        }

        cur.execute("""
            SELECT id, session_date, session_time, duration_minutes, session_type,
                   meeting_link, status, notes FROM sessions
            WHERE patient_id = %s ORDER BY session_date DESC, session_time DESC
        """, (patient_id,))
        sessions = [
            {"id": s[0], "session_date": str(s[1]), "session_time": str(s[2]),
             "duration_minutes": s[3], "session_type": s[4], "meeting_link": s[5],
             "status": s[6], "notes": s[7]}
            for s in cur.fetchall()
        ]

        cur.execute("""
            SELECT id, service_name, plan_type, start_date, end_date, sessions_total,
                   sessions_completed, amount_paid, payment_status
            FROM patient_plans WHERE patient_id = %s ORDER BY created_at DESC LIMIT 1
        """, (patient_id,))
        p = cur.fetchone()
        plan = None
        if p:
            plan = {
                "id": p[0], "service_name": p[1], "plan_type": p[2],
                "start_date": str(p[3]) if p[3] else None,
                "end_date": str(p[4]) if p[4] else None,
                "sessions_total": p[5], "sessions_completed": p[6],
                "amount_paid": float(p[7]) if p[7] else None, "payment_status": p[8]
            }

        cur.execute("""
            SELECT id, title, prescription_date, status, sent_at
            FROM prescriptions WHERE patient_id = %s ORDER BY created_at DESC
        """, (patient_id,))
        prescriptions = [
            {"id": px[0], "title": px[1], "prescription_date": str(px[2]),
             "status": px[3], "sent_at": str(px[4]) if px[4] else None}
            for px in cur.fetchall()
        ]

        cur.close(); conn.close()
        return {"patient": patient, "sessions": sessions,
                "plan": plan, "prescriptions": prescriptions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/patients/{patient_id}")
def update_patient(patient_id: int, update: PatientUpdate):
    try:
        conn = get_db(); cur = conn.cursor()
        fields, values = [], []
        for field in ["name", "email", "phone", "date_of_birth", "gender", "health_goals",
                      "medical_history", "allergies", "coordinator", "status"]:
            val = getattr(update, field)
            if val is not None:
                fields.append(f"{field} = %s"); values.append(val)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        fields.append("updated_at = NOW()")
        values.append(patient_id)
        cur.execute(f"UPDATE patients SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "Patient updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/patients/{patient_id}/share-brief")
def share_patient_brief(patient_id: int, req: SharePatientBriefRequest):
    """Generate and email an internal patient brief to a team member."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT id, name, email, phone, gender, health_goals, medical_history,
                   allergies, coordinator, status
            FROM patients WHERE id = %s
        """, (patient_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient = {"id": r[0], "name": r[1], "email": r[2], "phone": r[3],
                   "gender": r[4], "health_goals": r[5], "medical_history": r[6],
                   "allergies": r[7], "coordinator": r[8], "status": r[9]}

        cur.execute("""
            SELECT session_date, session_time, meeting_link FROM sessions
            WHERE patient_id = %s AND session_date >= CURRENT_DATE AND status = 'scheduled'
            ORDER BY session_date, session_time LIMIT 1
        """, (patient_id,))
        s = cur.fetchone()
        upcoming_session = (
            {"session_date": str(s[0]), "session_time": str(s[1]), "meeting_link": s[2]}
            if s else None
        )

        cur.execute("""
            SELECT service_name, sessions_total, sessions_completed FROM patient_plans
            WHERE patient_id = %s ORDER BY created_at DESC LIMIT 1
        """, (patient_id,))
        p = cur.fetchone()
        active_plan = (
            {"service_name": p[0], "sessions_total": p[1], "sessions_completed": p[2]}
            if p else None
        )

        cur.close(); conn.close()
        html = build_patient_brief_email(patient, upcoming_session, active_plan)
        sent = send_email(
            req.to_email, req.to_name or "Team",
            f"Patient Brief: {patient['name']} — Yoganteek Ops", html
        )
        return {"success": sent,
                "message": "Brief sent" if sent else "Could not send email (check SMTP config)"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Sessions ─────────────────────────────────────────────────

@app.post("/api/sessions")
def create_session(session: SessionCreate):
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            INSERT INTO sessions (patient_id, patient_name, patient_email, session_date,
                                  session_time, duration_minutes, session_type,
                                  meeting_link, coordinator)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (session.patient_id, session.patient_name, session.patient_email,
              session.session_date, session.session_time, session.duration_minutes,
              session.session_type, session.meeting_link, session.coordinator))
        session_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "session_id": session_id, "message": "Session scheduled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions")
def get_sessions(upcoming: bool = False, date_from: str = None, date_to: str = None):
    try:
        conn = get_db(); cur = conn.cursor()
        query = """
            SELECT id, patient_id, patient_name, patient_email, session_date, session_time,
                   duration_minutes, session_type, meeting_link, coordinator, status, notes, created_at
            FROM sessions
        """
        conditions, params = [], []
        if upcoming:
            conditions.append("session_date >= CURRENT_DATE AND status = 'scheduled'")
        if date_from:
            conditions.append("session_date >= %s"); params.append(date_from)
        if date_to:
            conditions.append("session_date <= %s"); params.append(date_to)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY session_date, session_time"
        cur.execute(query, params); rows = cur.fetchall(); cur.close(); conn.close()
        return {"sessions": [
            {"id": r[0], "patient_id": r[1], "patient_name": r[2], "patient_email": r[3],
             "session_date": str(r[4]), "session_time": str(r[5]), "duration_minutes": r[6],
             "session_type": r[7], "meeting_link": r[8], "coordinator": r[9],
             "status": r[10], "notes": r[11], "created_at": str(r[12])}
            for r in rows
        ], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/sessions/{session_id}")
def update_session(session_id: int, update: SessionUpdate):
    try:
        conn = get_db(); cur = conn.cursor()
        fields, values = [], []
        for field in ["status", "notes", "meeting_link", "session_date", "session_time", "coordinator"]:
            val = getattr(update, field)
            if val is not None:
                fields.append(f"{field} = %s"); values.append(val)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        values.append(session_id)
        cur.execute(f"UPDATE sessions SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "Session updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sessions/{session_id}/share")
def share_session_details(session_id: int, req: ShareSessionRequest):
    """Send session call details + meeting link to the patient's email."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT patient_name, patient_email, session_date, session_time,
                   duration_minutes, meeting_link, coordinator
            FROM sessions WHERE id = %s
        """, (session_id,))
        r = cur.fetchone()
        cur.close(); conn.close()
        if not r:
            raise HTTPException(status_code=404, detail="Session not found")
        patient_name, patient_email, sdate, stime, duration, meeting_link, coordinator = r
        if not patient_email:
            raise HTTPException(status_code=400, detail="No patient email on file for this session")
        html = build_session_share_email(
            patient_name=patient_name,
            session_date=str(sdate),
            session_time=str(stime),
            duration=duration or 30,
            meeting_link=meeting_link or "",
            coordinator=coordinator,
            prep_instructions=req.prep_instructions
        )
        sent = send_email(patient_email, patient_name,
                          "Your Consultation Details — Yoganteek Wellness", html)
        return {"success": sent,
                "message": "Session details sent to patient" if sent else "Could not send email (check SMTP config)"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calendly-booking")
def receive_calendly_booking(req: CalendlyBookingRequest):
    """
    Auto-capture a Calendly booking from the redirect URL parameters.
    Creates a session in the sessions table and links it to an existing lead.
    """
    try:
        conn = get_db(); cur = conn.cursor()

        # Parse ISO 8601 datetime from Calendly (e.g. 2026-08-05T10:30:00+05:30)
        session_date = None
        session_time = None
        try:
            # Handle timezone offset format
            dt_str = req.start_time.replace('+05:30', '+0530').replace('+00:00', '+0000')
            if '+' in dt_str[10:] or dt_str.endswith('Z'):
                dt_str = dt_str.replace('Z', '+0000')
                # Remove timezone offset for strptime, keep date/time
                naive = dt_str[:19]
                dt_obj = datetime.strptime(naive, '%Y-%m-%dT%H:%M:%S')
            else:
                dt_obj = datetime.strptime(dt_str[:19], '%Y-%m-%dT%H:%M:%S')
            session_date = dt_obj.strftime('%Y-%m-%d')
            session_time = dt_obj.strftime('%H:%M')
        except Exception as parse_err:
            print(f"[CALENDLY] Date parse error: {parse_err}, raw: {req.start_time}")
            # Try simple split as fallback
            try:
                parts = req.start_time.split('T')
                session_date = parts[0]
                session_time = parts[1][:5] if len(parts) > 1 else '10:00'
            except:
                session_date = date.today().isoformat()
                session_time = '10:00'

        # Find matching lead by email to link
        lead_id = None
        cur.execute("SELECT id FROM leads WHERE email = %s ORDER BY created_at DESC LIMIT 1", (req.email,))
        lead_row = cur.fetchone()
        if lead_row:
            lead_id = lead_row[0]

        # Create session record
        cur.execute("""
            INSERT INTO sessions (patient_id, patient_name, patient_email, session_date,
                                  session_time, duration_minutes, session_type,
                                  coordinator, status)
            VALUES (NULL, %s, %s, %s, %s, 30, %s, 'Dr. Jayashree Pattanaik', 'scheduled')
            RETURNING id
        """, (req.name, req.email, session_date, session_time, req.event_type))
        session_id = cur.fetchone()[0]

        # Auto-update lead status to consultation_booked
        if lead_id:
            cur.execute("""
                UPDATE leads SET status = 'consultation_booked',
                    notes = COALESCE(notes, '') || %s
                WHERE id = %s
            """, (f"\n[Auto] Consultation booked for {session_date} at {session_time}", lead_id))

        # Create notification
        cur.execute("""
            INSERT INTO notifications (type, priority, title, message, related_id, related_type)
            VALUES ('new_lead', 'medium', 'New Consultation Booked',
                    %s, %s, 'session')
        """, (f"{req.name} — {req.event_type} on {session_date} at {session_time}", session_id))

        conn.commit(); cur.close(); conn.close()
        return {"success": True, "session_id": session_id,
                "message": f"Booking captured for {req.name} on {session_date}"}
    except Exception as e:
        print(f"[CALENDLY ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/leads/{lead_id}/log-consultation")
def log_consultation(lead_id: int, req: LogConsultationRequest):
    """
    Manually log a consultation from the Ops Dashboard.
    Creates a session and updates lead status to consultation_booked.
    """
    try:
        conn = get_db(); cur = conn.cursor()

        # Fetch lead details
        cur.execute("SELECT name, email FROM leads WHERE id = %s", (lead_id,))
        lead = cur.fetchone()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        lead_name, lead_email = lead

        # Create session
        cur.execute("""
            INSERT INTO sessions (patient_id, patient_name, patient_email, session_date,
                                  session_time, duration_minutes, session_type,
                                  meeting_link, coordinator, status)
            VALUES (NULL, %s, %s, %s, %s, 30, %s, %s, 'Dr. Jayashree Pattanaik', 'scheduled')
            RETURNING id
        """, (lead_name, lead_email, req.session_date, req.session_time,
              req.session_type, req.meeting_link))
        session_id = cur.fetchone()[0]

        # Update lead status
        cur.execute("""
            UPDATE leads SET status = 'consultation_booked',
                notes = COALESCE(notes, '') || %s
            WHERE id = %s
        """, (f"\n[Manual] Consultation logged for {req.session_date} at {req.session_time}", lead_id))

        # Create notification
        cur.execute("""
            INSERT INTO notifications (type, priority, title, message, related_id, related_type)
            VALUES ('new_lead', 'medium', 'Consultation Logged',
                    %s, %s, 'session')
        """, (f"{lead_name} — {req.session_type} on {req.session_date} at {req.session_time}", session_id))

        conn.commit(); cur.close(); conn.close()
        return {"success": True, "session_id": session_id,
                "message": f"Consultation logged for {lead_name}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Bookings (Public Booking System) ────────────────────────

@app.get("/api/availability")
def get_availability(date: str = None):
    """
    Get available time slots for a given date.
    Working hours: Mon-Sat, 10:00 AM to 5:00 PM IST, 30-min slots.
    Checks both bookings and sessions tables for booked slots.
    """
    try:
        conn = get_db(); cur = conn.cursor()
        if not date:
            date = date.today().isoformat()

        # Define all possible slots (Mon-Sat, 10AM-5PM, 30min each)
        all_slots = []
        for hour in range(10, 17):  # 10 AM to 5 PM (last slot starts at 4:30 PM)
            for minute in [0, 30]:
                if hour == 17 and minute == 30:
                    break  # No 5:30 PM slot
                all_slots.append(f"{hour:02d}:{minute:02d}")

        # Get booked slots from bookings table
        cur.execute("""
            SELECT booking_time FROM bookings
            WHERE booking_date = %s AND status IN ('confirmed', 'rescheduled')
        """, (date,))
        booked_from_bookings = [str(row[0])[:5] for row in cur.fetchall()]

        # Get booked slots from sessions table
        cur.execute("""
            SELECT session_time FROM sessions
            WHERE session_date = %s AND status = 'scheduled'
        """, (date,))
        booked_from_sessions = [str(row[0])[:5] for row in cur.fetchall()]

        # Combine both lists
        booked_times = list(set(booked_from_bookings + booked_from_sessions))

        # Get day of week (0=Monday, 6=Sunday)
        try:
            from datetime import datetime as dt
            day_of_week = dt.strptime(date, '%Y-%m-%d').weekday()
        except:
            day_of_week = 0

        # Check if it's a weekend (Sunday)
        is_sunday = day_of_week == 6

        cur.close(); conn.close()

        if is_sunday:
            return {"date": date, "slots": [], "message": "No availability on Sundays"}

        available = [
            {"time": slot, "available": slot not in booked_times}
            for slot in all_slots
        ]

        return {"date": date, "slots": available}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bookings")
def create_booking(booking: BookingCreate):
    """Create a new public booking from the booking page."""
    try:
        conn = get_db(); cur = conn.cursor()

        # Check if slot is still available
        cur.execute("""
            SELECT id FROM bookings
            WHERE booking_date = %s AND booking_time = %s
            AND status IN ('confirmed', 'rescheduled')
        """, (booking.booking_date, booking.booking_time))
        if cur.fetchone():
            cur.close(); conn.close()
            raise HTTPException(status_code=409, detail="This time slot is already booked. Please choose another.")

        # Create booking
        cur.execute("""
            INSERT INTO bookings (patient_name, patient_email, patient_phone,
                                  health_goal, booking_date, booking_time, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'confirmed')
            RETURNING id
        """, (booking.patient_name, booking.patient_email, booking.patient_phone,
              booking.health_goal, booking.booking_date, booking.booking_time))
        booking_id = cur.fetchone()[0]

        # Create notification for ops team
        cur.execute("""
            INSERT INTO notifications (type, priority, title, message, related_id, related_type)
            VALUES ('new_lead', 'medium', 'New Booking Received',
                    %s, %s, 'booking')
        """, (f"{booking.patient_name} booked {booking.booking_date} at {booking.booking_time}", booking_id))

        # Also create a lead record for tracking
        cur.execute("""
            INSERT INTO leads (name, email, phone, health_goal, status, notes)
            VALUES (%s, %s, %s, %s, 'consultation_booked', %s)
        """, (booking.patient_name, booking.patient_email, booking.patient_phone,
              booking.health_goal, f"Auto-created from booking #{booking_id}"))

        # Create Google Calendar event with Meet link
        cal_result = create_google_calendar_event(
            patient_name=booking.patient_name,
            patient_email=booking.patient_email,
            booking_date=booking.booking_date,
            booking_time=booking.booking_time,
        )
        if cal_result:
            cur.execute("""
                UPDATE bookings
                SET calendar_event_id = %s, meeting_link = %s
                WHERE id = %s
            """, (cal_result['event_id'], cal_result['meeting_link'], booking_id))
            print(f"[BOOKING #{booking_id}] Google Calendar event created: {cal_result['event_id']}")
        else:
            print(f"[BOOKING #{booking_id}] Google Calendar event creation failed or skipped")

        conn.commit(); cur.close(); conn.close()
        return {"success": True, "booking_id": booking_id,
                "meeting_link": cal_result['meeting_link'] if cal_result else None,
                "message": f"Booking confirmed for {booking.booking_date} at {booking.booking_time}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/bookings")
def get_bookings(status: str = None, upcoming: bool = False):
    """List all bookings for the Ops Dashboard."""
    try:
        conn = get_db(); cur = conn.cursor()
        query = "SELECT id, patient_name, patient_email, patient_phone, health_goal, booking_date, booking_time, duration_minutes, meeting_link, status, assigned_doctor, notes, created_at FROM bookings"
        conditions, params = [], []
        if status:
            conditions.append("status = %s"); params.append(status)
        if upcoming:
            conditions.append("booking_date >= CURRENT_DATE AND status = 'confirmed'")
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY booking_date DESC, booking_time DESC"
        cur.execute(query, params); rows = cur.fetchall(); cur.close(); conn.close()
        return {"bookings": [
            {"id": r[0], "patient_name": r[1], "patient_email": r[2], "patient_phone": r[3],
             "health_goal": r[4], "booking_date": str(r[5]), "booking_time": str(r[6]),
             "duration_minutes": r[7], "meeting_link": r[8], "status": r[9],
             "assigned_doctor": r[10], "notes": r[11], "created_at": str(r[12])}
            for r in rows
        ], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/bookings/{booking_id}")
def update_booking(booking_id: int, update: BookingUpdate):
    """Update a booking (reschedule, cancel, assign doctor, etc.)."""
    try:
        conn = get_db(); cur = conn.cursor()
        fields, values = [], []
        for field in ["status", "booking_date", "booking_time", "meeting_link", "assigned_doctor", "notes"]:
            val = getattr(update, field)
            if val is not None:
                fields.append(f"{field} = %s"); values.append(val)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        values.append(booking_id)
        cur.execute(f"UPDATE bookings SET {', '.join(fields)} WHERE id = %s", values)

        # Create notification for status changes
        if update.status:
            cur.execute("SELECT patient_name, booking_date, booking_time FROM bookings WHERE id = %s", (booking_id,))
            b = cur.fetchone()
            if b:
                status_msg = f"{b[0]}'s booking ({b[1]} at {b[2]}) updated to {update.status}"
                cur.execute("""
                    INSERT INTO notifications (type, priority, title, message, related_id, related_type)
                    VALUES ('new_lead', 'medium', 'Booking Updated', %s, %s, 'booking')
                """, (status_msg, booking_id))

        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "Booking updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/bookings/{booking_id}")
def cancel_booking(booking_id: int):
    """Cancel a booking."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("UPDATE bookings SET status = 'cancelled' WHERE id = %s", (booking_id,))
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "Booking cancelled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Prescriptions ────────────────────────────────────────────

@app.post("/api/prescriptions")
def create_prescription(rx: PrescriptionCreate):
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            INSERT INTO prescriptions (patient_id, patient_name, patient_email, title, created_by,
                                       yoga_routine, breathing_exercises, nutrition_plan,
                                       lifestyle_tips, additional_notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (rx.patient_id, rx.patient_name, rx.patient_email, rx.title, rx.created_by,
              json.dumps(rx.yoga_routine) if rx.yoga_routine else None,
              json.dumps(rx.breathing_exercises) if rx.breathing_exercises else None,
              json.dumps(rx.nutrition_plan) if rx.nutrition_plan else None,
              rx.lifestyle_tips, rx.additional_notes))
        rx_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "prescription_id": rx_id, "message": "Prescription saved as draft"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/prescriptions")
def get_prescriptions(patient_id: int = None):
    try:
        conn = get_db(); cur = conn.cursor()
        if patient_id:
            cur.execute("""
                SELECT id, patient_id, patient_name, patient_email, title, created_by,
                       prescription_date, status, sent_at, created_at
                FROM prescriptions WHERE patient_id = %s ORDER BY created_at DESC
            """, (patient_id,))
        else:
            cur.execute("""
                SELECT id, patient_id, patient_name, patient_email, title, created_by,
                       prescription_date, status, sent_at, created_at
                FROM prescriptions ORDER BY created_at DESC
            """)
        rows = cur.fetchall(); cur.close(); conn.close()
        return {"prescriptions": [
            {"id": r[0], "patient_id": r[1], "patient_name": r[2], "patient_email": r[3],
             "title": r[4], "created_by": r[5], "prescription_date": str(r[6]),
             "status": r[7], "sent_at": str(r[8]) if r[8] else None, "created_at": str(r[9])}
            for r in rows
        ], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/prescriptions/{rx_id}/send")
def send_prescription(rx_id: int):
    """Email a care plan/prescription to the patient and mark it as sent."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT patient_name, patient_email, title, created_by, yoga_routine,
                   breathing_exercises, nutrition_plan, lifestyle_tips, additional_notes
            FROM prescriptions WHERE id = %s
        """, (rx_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Prescription not found")
        patient_name, patient_email, title, created_by, yoga_r, breath_r, nutrition_r, lifestyle, notes = r
        if not patient_email:
            raise HTTPException(status_code=400, detail="No patient email on this prescription")

        def _parse(val):
            if val is None:
                return []
            if isinstance(val, (list, dict)):
                return val
            try:
                return json.loads(val)
            except Exception:
                return []

        html = build_prescription_email(
            patient_name=patient_name, title=title,
            yoga_routine=_parse(yoga_r), breathing_exercises=_parse(breath_r),
            nutrition_plan=_parse(nutrition_r), lifestyle_tips=lifestyle,
            additional_notes=notes, created_by=created_by
        )
        sent = send_email(patient_email, patient_name,
                          "Your Wellness Care Plan — Yoganteek", html)
        if sent:
            cur.execute("UPDATE prescriptions SET status = 'sent', sent_at = NOW() WHERE id = %s", (rx_id,))
            conn.commit()
        cur.close(); conn.close()
        return {"success": sent,
                "message": "Prescription sent to patient" if sent else "Could not send email (check SMTP config)"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Patient Plans ────────────────────────────────────────────

@app.post("/api/patient-plans")
def create_patient_plan(plan: PatientPlanCreate):
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            INSERT INTO patient_plans (patient_id, service_name, plan_type, start_date, end_date,
                                       sessions_total, sessions_completed, amount_paid,
                                       payment_status, coordinator, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (plan.patient_id, plan.service_name, plan.plan_type, plan.start_date, plan.end_date,
              plan.sessions_total, plan.sessions_completed, plan.amount_paid,
              plan.payment_status, plan.coordinator, plan.notes))
        plan_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "plan_id": plan_id, "message": "Patient plan created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/patient-plans")
def get_patient_plans(patient_id: int = None):
    try:
        conn = get_db(); cur = conn.cursor()
        if patient_id:
            cur.execute("""
                SELECT id, patient_id, service_name, plan_type, start_date, end_date,
                       sessions_total, sessions_completed, amount_paid, payment_status,
                       coordinator, notes, created_at
                FROM patient_plans WHERE patient_id = %s ORDER BY created_at DESC
            """, (patient_id,))
            rows = cur.fetchall(); cur.close(); conn.close()
            return {"plans": [
                {"id": r[0], "patient_id": r[1], "service_name": r[2], "plan_type": r[3],
                 "start_date": str(r[4]) if r[4] else None, "end_date": str(r[5]) if r[5] else None,
                 "sessions_total": r[6], "sessions_completed": r[7],
                 "amount_paid": float(r[8]) if r[8] else None, "payment_status": r[9],
                 "coordinator": r[10], "notes": r[11], "created_at": str(r[12])}
                for r in rows
            ], "count": len(rows)}
        else:
            cur.execute("""
                SELECT pp.id, pp.patient_id, p.name, pp.service_name, pp.plan_type,
                       pp.start_date, pp.end_date, pp.sessions_total, pp.sessions_completed,
                       pp.amount_paid, pp.payment_status, pp.coordinator, pp.notes, pp.created_at
                FROM patient_plans pp
                LEFT JOIN patients p ON pp.patient_id = p.id
                ORDER BY pp.created_at DESC
            """)
            rows = cur.fetchall(); cur.close(); conn.close()
            return {"plans": [
                {"id": r[0], "patient_id": r[1], "patient_name": r[2], "service_name": r[3],
                 "plan_type": r[4], "start_date": str(r[5]) if r[5] else None,
                 "end_date": str(r[6]) if r[6] else None, "sessions_total": r[7],
                 "sessions_completed": r[8], "amount_paid": float(r[9]) if r[9] else None,
                 "payment_status": r[10], "coordinator": r[11], "notes": r[12],
                 "created_at": str(r[13])}
                for r in rows
            ], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Notifications ────────────────────────────────────────────

@app.get("/api/notifications")
def get_notifications(unread: bool = False, limit: int = 50):
    try:
        conn = get_db(); cur = conn.cursor()
        query = """
            SELECT id, type, priority, title, message, related_id, related_type, is_read, created_at
            FROM notifications
        """
        params = []
        if unread:
            query += " WHERE is_read = FALSE"
        query += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)
        cur.execute(query, params); rows = cur.fetchall()

        unread_count = 0
        if not unread:
            cur.execute("SELECT COUNT(*) FROM notifications WHERE is_read = FALSE")
            unread_count = cur.fetchone()[0]

        cur.close(); conn.close()
        return {
            "notifications": [
                {"id": r[0], "type": r[1], "priority": r[2], "title": r[3],
                 "message": r[4], "related_id": r[5], "related_type": r[6],
                 "is_read": r[7], "created_at": str(r[8])}
                for r in rows
            ],
            "unread_count": unread_count,
            "count": len(rows)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("UPDATE notifications SET is_read = TRUE WHERE id = %s", (notification_id,))
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "Notification marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/notifications/read-all")
def mark_all_notifications_read():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE")
        conn.commit(); cur.close(); conn.close()
        return {"success": True, "message": "All notifications marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/generate")
def generate_notifications():
    """
    Scan sessions, leads, and prescriptions to create smart notifications.
    Called by the frontend on load and every 60 seconds.
    Also auto-sends session reminder emails (24h before and 1h before).
    """
    try:
        conn = get_db(); cur = conn.cursor()
        now = datetime.now()
        today = date.today()
        created = 0

        cur.execute("""
            DELETE FROM notifications
            WHERE id NOT IN (
                SELECT MIN(id) FROM notifications
                GROUP BY type, related_id, related_type
            )
        """)
        cleaned = cur.rowcount
        if cleaned:
            print(f"[NOTIFY] Cleaned {cleaned} duplicate notifications")

        def notification_exists(ntype: str, related_id: int, related_type: str) -> bool:
            """Prevent duplicate notifications for the same item."""
            cur.execute("""
                SELECT id FROM notifications
                WHERE type = %s AND related_id = %s AND related_type = %s
            """, (ntype, related_id, related_type))
            return cur.fetchone() is not None

        def add_notification(ntype: str, priority: str, title: str,
                              message: str, related_id: int, related_type: str):
            nonlocal created
            try:
                cur.execute("""
                    INSERT INTO notifications (type, priority, title, message, related_id, related_type)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (type, related_id, related_type) DO NOTHING
                """, (ntype, priority, title, message, related_id, related_type))
                if cur.rowcount > 0:
                    created += 1
            except Exception as e:
                print(f"[NOTIFY] Insert error: {e}")

        # 1. Upcoming sessions (next 60 min) + auto-reminder emails
        cur.execute("""
            SELECT id, patient_name, patient_email, session_date, session_time,
                   meeting_link, reminder_24h_sent, reminder_1h_sent
            FROM sessions WHERE session_date = %s AND status = 'scheduled'
        """, (today,))
        for s in cur.fetchall():
            sid, pname, pemail, sdate, stime, mlink, r24, r1h = s
            try:
                session_dt = datetime.combine(sdate, stime)
                delta_min = (session_dt - now).total_seconds() / 60

                if 0 < delta_min <= 60:
                    add_notification("upcoming_session", "high",
                                     f"Session in {int(delta_min)} min",
                                     f"Consultation with {pname} starts soon.",
                                     sid, "session")

                if 0 < delta_min <= 15:
                    add_notification("session_starting_soon", "high",
                                     f"Starting now: {pname}",
                                     f"Session with {pname} starts in {int(delta_min)} minutes.",
                                     sid, "session")

                # Send 24h reminder email
                if not r24 and 23 * 60 <= delta_min <= 25 * 60 and pemail:
                    html = build_session_reminder_email(pname, str(sdate), str(stime), mlink or "", 24)
                    if send_email(pemail, pname, "Reminder: Your session tomorrow — Yoganteek", html):
                        cur.execute("UPDATE sessions SET reminder_24h_sent = TRUE WHERE id = %s", (sid,))

                # Send 1h reminder email
                if not r1h and 50 <= delta_min <= 70 and pemail:
                    html = build_session_reminder_email(pname, str(sdate), str(stime), mlink or "", 1)
                    if send_email(pemail, pname, "Reminder: Your session in 1 hour — Yoganteek", html):
                        cur.execute("UPDATE sessions SET reminder_1h_sent = TRUE WHERE id = %s", (sid,))

            except Exception as session_err:
                print(f"[NOTIFY] Session {sid} error: {session_err}")

        # 2. New uncontacted leads (last 48h)
        cur.execute("""
            SELECT id, name FROM leads
            WHERE (status = 'new' OR status IS NULL)
              AND created_at >= NOW() - INTERVAL '48 hours'
        """)
        for lid, lname in cur.fetchall():
            add_notification("new_lead", "medium", f"New lead: {lname}",
                             f"{lname} submitted an enquiry and hasn't been contacted yet.",
                             lid, "lead")

        # 3. Follow-ups due today
        cur.execute("""
            SELECT id, name FROM leads
            WHERE follow_up_date <= CURRENT_DATE
              AND status NOT IN ('converted','not_interested')
              AND follow_up_date IS NOT NULL
        """)
        for lid, lname in cur.fetchall():
            add_notification("follow_up_due", "medium", f"Follow-up due: {lname}",
                             f"Scheduled follow-up with {lname} is due today.",
                             lid, "lead")

        # 4. Draft prescriptions older than 24h
        cur.execute("""
            SELECT id, patient_name FROM prescriptions
            WHERE status = 'draft' AND created_at < NOW() - INTERVAL '24 hours'
        """)
        for rxid, pname in cur.fetchall():
            add_notification("prescription_pending", "low",
                             f"Unsent care plan: {pname}",
                             f"A care plan for {pname} has been in draft for over 24 hours.",
                             rxid, "prescription")

        # Clean up notifications older than 7 days
        cur.execute("DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '7 days'")

        conn.commit(); cur.close(); conn.close()
        return {"success": True, "notifications_created": created,
                "message": f"{created} new notification(s) generated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Google Calendar Sync ────────────────────────────────────

@app.get("/api/google-calendar/sync")
def sync_google_calendar(days_ahead: int = 7):
    """
    Fetch upcoming events from Google Calendar and auto-create/update bookings.
    Returns the synced events with meeting links.
    """
    try:
        events = fetch_google_calendar_events(days_ahead)
        if not events:
            return {"success": True, "events": [], "message": "No events found or Google Calendar not configured"}

        conn = get_db(); cur = conn.cursor()
        synced = []

        for event in events:
            if not event['start']:
                continue

            # Parse event start time
            try:
                start_str = event['start']
                if 'T' in start_str:
                    event_dt = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
                else:
                    event_dt = datetime.strptime(start_str, '%Y-%m-%d')
                event_date = event_dt.strftime('%Y-%m-%d')
                event_time = event_dt.strftime('%H:%M')
            except Exception as parse_err:
                print(f"[GOOGLE CAL] Parse error for event: {parse_err}")
                continue

            # Check if this Google event already synced
            cur.execute("""
                SELECT id FROM bookings WHERE calendar_event_id = %s
            """, (event['google_event_id'],))
            existing = cur.fetchone()

            if existing:
                # Update meeting link if changed
                if event['meeting_link']:
                    cur.execute("""
                        UPDATE bookings SET meeting_link = %s WHERE id = %s
                        AND (meeting_link IS NULL OR meeting_link != %s)
                    """, (event['meeting_link'], existing[0], event['meeting_link']))
            else:
                # Try to match with existing booking by date/time
                cur.execute("""
                    SELECT id FROM bookings
                    WHERE booking_date = %s AND booking_time = %s
                    AND status IN ('confirmed', 'rescheduled')
                """, (event_date, event_time))
                match = cur.fetchone()

                if match:
                    # Update existing booking with Google event data
                    cur.execute("""
                        UPDATE bookings
                        SET calendar_event_id = %s, meeting_link = COALESCE(%s, meeting_link)
                        WHERE id = %s
                    """, (event['google_event_id'], event['meeting_link'], match[0]))
                    booking_id = match[0]
                else:
                    # Create new booking from calendar event
                    attendees = ', '.join(event['attendees'][:3]) if event['attendees'] else ''
                    cur.execute("""
                        INSERT INTO bookings (patient_name, patient_email, booking_date,
                                              booking_time, meeting_link, calendar_event_id,
                                              status, notes)
                        VALUES (%s, %s, %s, %s, %s, %s, 'confirmed', %s)
                        RETURNING id
                    """, (
                        event['summary'] or 'Calendar Event',
                        attendees,
                        event_date,
                        event_time,
                        event['meeting_link'],
                        event['google_event_id'],
                        f"Auto-synced from Google Calendar"
                    ))
                    booking_id = cur.fetchone()[0]

            synced.append({
                'summary': event['summary'],
                'date': event_date,
                'time': event_time,
                'meeting_link': event['meeting_link'],
            })

        conn.commit(); cur.close(); conn.close()
        return {
            "success": True,
            "events": synced,
            "count": len(synced),
            "message": f"Synced {len(synced)} event(s) from Google Calendar"
        }
    except Exception as e:
        print(f"[GOOGLE CAL SYNC ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/google-calendar/status")
def google_calendar_status():
    """Check if Google Calendar integration is configured."""
    return {
        "configured": bool(GOOGLE_SERVICE_ACCOUNT_JSON),
        "calendar_id": GOOGLE_CALENDAR_ID,
        "library_available": GOOGLE_CALENDAR_AVAILABLE,
    }


# ─────────────────────────────────────────────
# ROOT
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "Yoganteek API is running",
        "version": "2.0 — Ops Dashboard enabled",
        "endpoints": {
            "public": ["/api/leads", "/api/corporate-inquiries", "/api/contact-submissions"],
            "ops_leads": ["/api/leads/{id}/status", "/api/corporate-inquiries/{id}/status",
                          "/api/contact-submissions/{id}/status"],
            "ops_dashboard": ["/api/dashboard/stats"],
            "ops_patients": ["/api/patients", "/api/patients/{id}", "/api/patients/{id}/share-brief"],
            "ops_sessions": ["/api/sessions", "/api/sessions/{id}", "/api/sessions/{id}/share"],
            "ops_prescriptions": ["/api/prescriptions", "/api/prescriptions/{id}/send"],
            "ops_plans": ["/api/patient-plans"],
            "ops_notifications": ["/api/notifications", "/api/notifications/generate",
                                  "/api/notifications/{id}/read", "/api/notifications/read-all"],
            "ops_bookings": ["/api/bookings", "/api/availability"],
            "ops_google_calendar": ["/api/google-calendar/sync", "/api/google-calendar/status"]
        }
    }


@app.get("/api/google-calendar/test-create")
def test_create_calendar_event():
    """Debug endpoint to test Google Calendar event creation directly."""
    results = {"steps": []}

    # Step 1: Check service account JSON
    results["steps"].append({
        "step": "check_env",
        "has_json": bool(GOOGLE_SERVICE_ACCOUNT_JSON),
        "json_length": len(GOOGLE_SERVICE_ACCOUNT_JSON) if GOOGLE_SERVICE_ACCOUNT_JSON else 0,
    })

    # Step 2: Build service
    service = get_google_calendar_service()
    results["steps"].append({
        "step": "build_service",
        "success": service is not None,
    })
    if not service:
        results["error"] = "Failed to build Google Calendar service"
    return results


@app.get("/api/keepalive")
def keepalive():
    """Keep-alive endpoint to prevent Render free tier from sleeping."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

    # Step 3: Try to create a test event
    try:
        from datetime import datetime, timedelta
        now = datetime(2026, 7, 31, 15, 0)
        end = now + timedelta(minutes=30)
        start_iso = now.strftime("%Y-%m-%dT%H:%M:%S+05:30")
        end_iso = end.strftime("%Y-%m-%dT%H:%M:%S+05:30")

        event_body = {
            'summary': 'Test Event - Debug',
            'description': 'Debug test event',
            'start': {'dateTime': start_iso, 'timeZone': 'Asia/Kolkata'},
            'end': {'dateTime': end_iso, 'timeZone': 'Asia/Kolkata'},
        }

        # Step 1: Create event without conference data
        event = service.events().insert(
            calendarId=GOOGLE_CALENDAR_ID,
            body=event_body,
        ).execute()

        results["steps"].append({
            "step": "create_event",
            "success": True,
            "event_id": event.get('id'),
        })

        # Step 2: Try to patch with Meet conference
        try:
            patch_body = {
                'conferenceData': {
                    'createRequest': {
                        'requestId': 'debug-test-123',
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'},
                    }
                },
            }
            updated = service.events().patch(
                calendarId=GOOGLE_CALENDAR_ID,
                eventId=event['id'],
                body=patch_body,
                conferenceDataVersion=1,
            ).execute()
            results["steps"].append({
                "step": "add_meet",
                "success": True,
                "hangout_link": updated.get('hangoutLink', ''),
            })
        except Exception as meet_err:
            results["steps"].append({
                "step": "add_meet",
                "success": False,
                "error": str(meet_err),
            })

        # Delete the test event
        service.events().delete(
            calendarId=GOOGLE_CALENDAR_ID,
            eventId=event['id'],
        ).execute()
        results["steps"].append({"step": "cleanup", "deleted": True})

    except Exception as e:
        results["steps"].append({
            "step": "create_event",
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
        })

    return results
