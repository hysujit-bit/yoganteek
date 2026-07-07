from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI(title="Yoganteek API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use environment variable for DB URL (set in Railway)
DB_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/Yoganteek?sslmode=require'
)

# Email config (set via environment variables)
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', 'yoganteekwellness@gmail.com')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'yoganteekwellness@gmail.com')
FROM_NAME = os.environ.get('FROM_NAME', 'Yoganteek Wellness')


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: str
    health_goal: Optional[str] = None
    concern: Optional[str] = None
    message: Optional[str] = None
    calendly_url: Optional[str] = None


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


def get_db():
    return psycopg2.connect(DB_URL)


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


def build_lead_acknowledgement(name: str) -> str:
    return f"""
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fafafa;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#2D2A3E;margin:0;">Yoganteek Wellness</h1>
        <p style="font-size:12px;color:#888;margin-top:4px;">Dr. Jayashree Pattanayak</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid rgba(0,0,0,.06);">
        <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#2D2A3E;margin:0 0 12px;">Thank You, {name}!</h2>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
          We've received your inquiry and our team will get back to you within <strong>24 hours</strong>.
        </p>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
          In the meantime, feel free to reach out to us at
          <a href="mailto:yoganteekwellness@gmail.com" style="color:#5A4A72;">yoganteekwellness@gmail.com</a>
          or call us at <a href="tel:7978311312" style="color:#5A4A72;">+91 797 831 1312</a>.
        </p>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Namaste!</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <p style="font-size:11px;color:#aaa;">&copy; 2026 Yoganteek Wellness Clinic. All rights reserved.</p>
      </div>
    </div>
    """


def build_corporate_acknowledgement(contact_name: str, company_name: str) -> str:
    return f"""
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fafafa;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#2D2A3E;margin:0;">Yoganteek Wellness</h1>
        <p style="font-size:12px;color:#888;margin-top:4px;">Corporate Wellness Programs</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid rgba(0,0,0,.06);">
        <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#2D2A3E;margin:0 0 12px;">Thank You, {contact_name}!</h2>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
          We've received your corporate wellness inquiry for <strong>{company_name}</strong>.
        </p>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 16px;">
          Our team is preparing a customized proposal for your organization. You can expect to hear from us within <strong>24 hours</strong>.
        </p>
        <div style="background:#F7F4FB;border-radius:12px;padding:20px;margin:0 0 16px;">
          <p style="font-size:13px;color:#5A4A72;margin:0;font-weight:600;">What happens next?</p>
          <ul style="font-size:13px;color:#555;line-height:1.8;margin:8px 0 0;padding-left:20px;">
            <li>We review your requirements</li>
            <li>Design a customized wellness program</li>
            <li>Share a detailed proposal with pricing</li>
            <li>Schedule a call to discuss details</li>
          </ul>
        </div>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">
          Questions? Reach us at
          <a href="mailto:yoganteekwellness@gmail.com" style="color:#5A4A72;">yoganteekwellness@gmail.com</a>
          or <a href="tel:7978311312" style="color:#5A4A72;">+91 797 831 1312</a>.
        </p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <p style="font-size:11px;color:#aaa;">&copy; 2026 Yoganteek Wellness Clinic. All rights reserved.</p>
      </div>
    </div>
    """


def ensure_leads_table():
    """Create leads table if it doesn't exist."""
    try:
        conn = get_db()
        cur = conn.cursor()
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
        conn.commit()
        cur.close()
        conn.close()
        print("[DB] leads table ready")
    except Exception as e:
        print(f"[DB] Error ensuring leads table: {e}")


def ensure_corporate_table():
    """Create corporate_inquiries table if it doesn't exist."""
    try:
        conn = get_db()
        cur = conn.cursor()
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
        conn.commit()
        cur.close()
        conn.close()
        print("[DB] corporate_inquiries table ready")
    except Exception as e:
        print(f"[DB] Error ensuring corporate_inquiries table: {e}")


# Ensure tables exist on startup
try:
    conn = get_db()
    conn.close()
    print("[DB] Database connection successful")
    ensure_leads_table()
    ensure_corporate_table()
except Exception as e:
    print(f"[DB] CRITICAL: Database connection failed on startup: {e}")


@app.post("/api/leads")
def create_lead(lead: LeadCreate):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO leads (name, email, phone, health_goal, concern, message, calendly_url)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (lead.name, lead.email, lead.phone, lead.health_goal, lead.concern, lead.message, lead.calendly_url)
        )
        lead_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        # Send acknowledgement email
        send_email(lead.email, lead.name, "Thank you for your inquiry - Yoganteek Wellness", build_lead_acknowledgement(lead.name))

        return {"success": True, "lead_id": lead_id, "message": "Lead saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/leads")
def get_leads():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, phone, health_goal, concern, created_at FROM leads ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        leads = []
        for row in rows:
            leads.append({
                "id": row[0], "name": row[1], "email": row[2],
                "phone": row[3], "health_goal": row[4],
                "concern": row[5], "created_at": str(row[6])
            })
        return {"leads": leads, "count": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/corporate-inquiries")
def create_corporate_inquiry(inquiry: CorporateInquiryCreate):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO corporate_inquiries
               (company_name, contact_name, email, phone, employee_count, preferred_program, preferred_schedule, industry, message)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (inquiry.company_name, inquiry.contact_name, inquiry.email, inquiry.phone,
             inquiry.employee_count, inquiry.preferred_program, inquiry.preferred_schedule,
             inquiry.industry, inquiry.message)
        )
        inquiry_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        # Send acknowledgement email
        send_email(
            inquiry.email,
            inquiry.contact_name,
            f"Corporate Wellness Inquiry Received - Yoganteek Wellness",
            build_corporate_acknowledgement(inquiry.contact_name, inquiry.company_name)
        )

        return {"success": True, "inquiry_id": inquiry_id, "message": "Corporate inquiry saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/corporate-inquiries")
def get_corporate_inquiries():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, company_name, contact_name, email, phone, employee_count, preferred_program, preferred_schedule, industry, message, created_at FROM corporate_inquiries ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        inquiries = []
        for row in rows:
            inquiries.append({
                "id": row[0], "company_name": row[1], "contact_name": row[2],
                "email": row[3], "phone": row[4], "employee_count": row[5],
                "preferred_program": row[6], "preferred_schedule": row[7],
                "industry": row[8], "message": row[9], "created_at": str(row[10])
            })
        return {"inquiries": inquiries, "count": len(inquiries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def root():
    return {"status": "Yoganteek API is running"}
