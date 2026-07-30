# Yoganteek Internal Operations Dashboard — Implementation Plan

> **Created:** 2026-07-26
> **Status:** Approved for Development
> **Project Manager:** Sujit

---

## Overview

A password-protected, browser-based **internal operations dashboard** for Yoganteek's team (Dr. Jayashree + operations staff). This dashboard handles the full patient/lead lifecycle — from first enquiry through consultation, ongoing care, and communication.

It lives at **`ops.yoganteek.com`** — a subdomain that is separate from the public website but fully integrated with the same backend and database.

---

## Architecture — Separated Yet Integrated

```
yoganteek.com          →  Public website (existing, unchanged)
ops.yoganteek.com      →  Internal ops dashboard (new)
api.render.com/...     →  Shared FastAPI backend (existing, extended)
Neon PostgreSQL        →  Shared database (existing, extended with new tables)
```

| Layer | Public Website | Ops Dashboard |
|-------|---------------|---------------|
| **URL** | `yoganteek.com` | `ops.yoganteek.com` |
| **Hosting** | cPanel (existing) | Vercel (React + Node PWA) |
| **Deployment** | GitHub Actions → cPanel | Vercel Git Auto-deploy (Instant CI/CD) |
| **Backend API** | Render (existing) | Shared Render FastAPI (`backend/main.py`) |
| **Database** | Neon PostgreSQL | Same DB — new tables added |
| **Access** | Public | Passcode-protected (team only) |
| **Mobile App** | Web Responsive | Progressive Web App (PWA) with App Shell & Bottom Nav |
| **Brand/Design** | Yoganteek style | Same Yoganteek style |
| **Extra hosting cost?** | — | Zero (Vercel Hobby Tier) |

### 3 Layers of Access Protection

| Layer | How |
|-------|-----|
| **Obscurity** | URL not linked anywhere public, not in sitemap, `robots.txt` blocks crawlers |
| **App-level passcode** | In-page passcode lock stored in `localStorage` |
| **cPanel htaccess** (optional) | Server-level `.htaccess` password blocks the page entirely before it loads |

### How "Integration" Works in Practice

- Leads submitted on `yoganteek.com` → land in Neon DB → **instantly appear** in ops dashboard Leads tab
- Team converts lead → Patient → schedules Session → shares call details — all from ops dashboard
- Prescriptions emailed from ops dashboard use the **same SMTP** (Gmail via Render)
- **One database, one source of truth** — no syncing, no duplication

---

## Modules

### Module 1 — Dashboard Shell & Navigation

A single-page app with a left sidebar and main content panel. No page reloads — JS switches tabs.

| Icon | Tab | Purpose |
|------|-----|---------|
| 🏠 | Dashboard | At-a-glance stats + today's sessions |
| 👥 | Leads & Enquiries | All inbound leads + status tracking |
| 📋 | Patients | Full patient profiles + history |
| 📅 | Sessions | Upcoming consultations calendar |
| 💊 | Prescriptions | Build & send care plans |
| 📦 | Services & Plans | What each patient is enrolled in |
| 🔔 | Notifications | Smart alerts — upcoming sessions, follow-ups, new leads |
| ⚙️ | Settings | Passcode, team members |

---

### Module 2 — Dashboard Home

**What the doctor/team sees first:**
- 📊 **Stat cards:** Open Leads · Active Patients · Sessions Today · Follow-ups Pending
- 📅 **"Today's Sessions"** — chronological list with patient name, time, Zoom/Meet link button, status badge
- 🔔 **Notification Bell (top-right)** — live unread badge; clicking opens a dropdown with latest 5 alerts
- ⚠️ **"Needs Attention" strip** — pinned banner showing highest-priority alert of the day (e.g., *"Session with Meera Singh in 15 minutes"*, *"3 leads haven't been contacted in 48h"*)
- 📈 **Mini pipeline** — leads by stage (New → Contacted → Consultation → Active Patient → Churned)

---

### Module 3 — Leads & Enquiries

**Existing data in DB:** `leads`, `contact_submissions`, `corporate_inquiries` tables.

**New features:**
- Unified view of all 3 tables with source badges (Website Form / Ad / Corporate)
- Status pipeline: `New` → `Contacted` → `Consultation Booked` → `Converted` → `Not Interested`
- Internal ops notes per lead
- Assign coordinator
- Follow-up date setter
- **"Convert to Patient"** — one-click creates a Patient record from the lead

**New DB columns on existing tables:**
```sql
ALTER TABLE leads ADD COLUMN status VARCHAR(50) DEFAULT 'new';
ALTER TABLE leads ADD COLUMN coordinator VARCHAR(100);
ALTER TABLE leads ADD COLUMN notes TEXT;
ALTER TABLE leads ADD COLUMN follow_up_date DATE;
-- (Same columns added to contact_submissions and corporate_inquiries)
```

---

### Module 4 — Patients

**New DB table: `patients`**

```sql
CREATE TABLE patients (
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
    status VARCHAR(50) DEFAULT 'active',   -- active / paused / completed
    source VARCHAR(50),
    lead_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Patient Profile View contains:**
- Personal & contact info
- Health history & goals
- Enrolled services/plans (linked to `patient_plans`)
- Session history (linked to `sessions`)
- Prescriptions sent (linked to `prescriptions`)
- Internal notes timeline (CRM-style activity log)
- Assigned coordinator
- Next session card with meeting link

#### 📤 Share Patient Details / Brief

**"Share Patient Brief" button** (on every patient profile):
- Generates a formatted Patient Brief containing:
  - Patient name, age, contact
  - Health goals & medical history summary
  - Active enrolled plan & sessions progress
  - Last prescription summary
  - Upcoming session date/time + meeting link
  - Internal coordinator notes
- **3 sharing options:**
  1. 📧 **Email to team member** — enter any email → sends clean HTML brief (internal only)
  2. 📋 **Copy to Clipboard** — plain-text version for pasting into WhatsApp/Slack
  3. 🔗 **Shareable Link** *(Phase 2)* — temporary, token-protected URL

**New API route:** `POST /api/patients/{id}/share-brief`

---

### Module 5 — Sessions / Consultations

**New DB table: `sessions`**

```sql
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    patient_name VARCHAR(255),
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    session_type VARCHAR(50),              -- initial / follow-up / group / corporate
    meeting_link TEXT,                     -- Zoom/Google Meet URL
    coordinator VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled / completed / cancelled / no-show
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Sessions view:**
- Calendar-style day/week view + list view toggle
- Color-coded by status
- Click session → modal with full details + meeting link button
- Add new session form (patient lookup, date/time picker, meeting link input)
- Post-session: mark complete + add notes

#### 📤 Share Session / Call Details with Patient

**"Share Call Details" button** (on every session card):
- Sends a **branded HTML email** to the patient with:
  - Session date & time (clearly formatted)
  - Duration
  - Zoom / Google Meet link as a prominent CTA button
  - Coordinator name & contact
  - Optional prep instructions
  - Yoganteek branding (sage green, logo — matching existing email style)
- **WhatsApp share** — opens `wa.me` pre-filled with session details + link
- **Copy Link** — copies just the meeting URL to clipboard

**New API route:** `POST /api/sessions/{id}/share`

**Session reminder emails:** Auto-sent **24 hours before** and **1 hour before** the session (triggered by the notifications generate job)

---

### Module 6 — Prescriptions / Care Plan Builder

**New DB table: `prescriptions`**

```sql
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    patient_name VARCHAR(255),
    patient_email VARCHAR(255),
    title VARCHAR(255),
    created_by VARCHAR(100),
    prescription_date DATE DEFAULT CURRENT_DATE,
    yoga_routine JSONB,        -- [{pose: "Tadasana", duration: "5 min", notes: "..."}]
    breathing_exercises JSONB, -- [{name: "Anulom Vilom", reps: "10", notes: "..."}]
    nutrition_plan JSONB,      -- [{meal: "Breakfast", items: ["oats", "fruits"], notes: "..."}]
    lifestyle_tips TEXT,
    additional_notes TEXT,
    status VARCHAR(50) DEFAULT 'draft',  -- draft / sent
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Builder UI:**
- Patient picker (search by name)
- 4-tab builder: **Yoga Routine** | **Breathing Exercises** | **Nutrition Plan** | **Lifestyle Tips**
- Each tab has a dynamic "add item" form
- **Preview** — formatted prescription card in Yoganteek brand
- **Send via Email** — dispatches branded HTML email to patient
- **Download PDF** — browser print-to-PDF
- **Copy Link** — shareable link (future)

---

### Module 7 — Notifications

The real-time awareness layer. Notifications are **auto-generated** by the backend and shown in the dashboard and optionally as browser alerts.

#### 5 Types of Notifications

| Type | Trigger | Priority |
|------|---------|----------|
| 🗓 **Upcoming Session** | Session within 60 minutes | 🔴 High |
| ⏰ **Session Starting Soon** | Session in 15 minutes | 🔴 High |
| 📬 **New Lead / Enquiry** | New lead hits the DB | 🟡 Medium |
| 🔁 **Follow-up Due** | Lead's `follow_up_date` has arrived | 🟡 Medium |
| 💊 **Prescription Not Sent** | Draft prescription >24h old | 🟢 Low |

#### In-App Notification Bell
- Fixed in top-right header — always visible across all tabs
- Unread count badge (red dot + number)
- Clicking opens a **slide-in drawer** with:
  - All notifications in reverse chronological order
  - Icon, message, patient/lead name link, timestamp, Mark as Read button
  - "Mark All Read" button
  - Notifications older than 7 days auto-archived

#### Notifications Tab (Full View)
- **Today** — all alerts grouped by time
- **Upcoming Sessions** — next 7 days with countdown timers
- **Follow-ups Due** — overdue items highlighted amber/red
- **New Leads** — last 48h, uncontacted
- Filter by type and priority

#### Auto-Refresh
- Polls backend every **60 seconds**
- Browser tab title: `(3) Yoganteek Ops` when unread alerts exist

#### Browser Push Notifications (Optional)
- Native OS push for High-priority session alerts when tab is minimized

#### New DB table: `notifications`

```sql
CREATE TABLE notifications (
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
```

**API routes:**
- `GET /api/notifications?unread=true`
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/read-all`
- `POST /api/notifications/generate`

---

### Module 8 — Services & Plans

**New DB table: `patient_plans`**

```sql
CREATE TABLE patient_plans (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    service_name VARCHAR(255),
    plan_type VARCHAR(100),    -- individual / corporate
    start_date DATE,
    end_date DATE,
    sessions_total INTEGER,
    sessions_completed INTEGER DEFAULT 0,
    amount_paid DECIMAL(10,2),
    payment_status VARCHAR(50) DEFAULT 'pending',  -- pending / partial / paid
    coordinator VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**View:** Active plans with progress bars (sessions completed/total) and payment status badges.

---

## Backend Extensions (FastAPI — `backend/main.py`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/patients` | List & create patients |
| GET/PUT | `/api/patients/{id}` | Get & update patient |
| POST | `/api/patients/{id}/share-brief` | Email patient brief to a team member |
| GET/POST | `/api/sessions` | List & create sessions |
| PUT | `/api/sessions/{id}` | Update session (status, notes) |
| POST | `/api/sessions/{id}/share` | Email session/call details to patient |
| GET/POST | `/api/prescriptions` | List & create prescriptions |
| POST | `/api/prescriptions/{id}/send` | Email prescription to patient |
| GET/POST | `/api/patient-plans` | List & create patient plans |
| PUT | `/api/leads/{id}/status` | Update lead status/notes |
| GET | `/api/dashboard/stats` | Aggregated dashboard stats |
| GET | `/api/notifications` | Fetch notifications (unread filter) |
| PUT | `/api/notifications/{id}/read` | Mark notification as read |
| PUT | `/api/notifications/read-all` | Mark all notifications as read |
| POST | `/api/notifications/generate` | Auto-generate alerts from sessions/leads |

---

## Frontend Architecture (Node & React PWA)

**`ops-dashboard/`** (served at `ops.yoganteek.com` via Vercel)
- React SPA & Progressive Web App built with Vite & Node tooling
- Modular component architecture (Layout, Dashboard, Leads, Patients, Sessions, Prescriptions, Plans, Notifications)
- PWA features: `manifest.json`, Service Worker caching, iOS/Android home screen install support
- Dual Navigation Shell: Desktop Forest Green Sidebar + Mobile Fixed Bottom Navigation Bar
- Passcode Auth Guard (SHA-256 hash check stored in `localStorage`)
- Axios API service connecting to shared Render backend (`https://yoganteek-api.onrender.com`)

---

## Design System

Follows Yoganteek's existing brand:
- **Colors:** `--sage: #7A8B6F`, `--forest: #3D4F35`, `--cream: #FAF8F5`, `--accent-gold: #C4A265`
- **Typography:** `Cormorant Garamond` (headings) + `DM Sans` (body) via Google Fonts
- **Dark sidebar / Bottom nav** — forest green background
- **Cards** — cream backgrounds, subtle borders, hover lifts
- **Status badges** — color-coded pill badges (green=active, amber=pending, red=overdue)
- **Smooth transitions** — tab switching, slide-over drawers, and modal open/close

---

## Deployment & Hosting

### Vercel Deployment & Subdomain Setup
1. **GitHub Integration:** Push repository to GitHub. Connect `ops-dashboard/` root folder to a new Vercel Project.
2. **Temporary Vercel Domain:** Vercel automatically provides a preview domain (e.g., `<project>.vercel.app`) which can be used for testing.
3. **Custom Domain (optional):** When ready, add `ops.yoganteek.com` in Vercel Project Settings → Domains and configure the CNAME record.
4. **Environment Variables:** Set `VITE_API_BASE_URL` in Vercel to point to your Render backend API.

### Database
- New tables created via `ensure_*` functions in `main.py` (same pattern as existing tables)
- New columns on existing tables via `ALTER TABLE` in startup functions
- No data migration needed — new columns have safe defaults

### Environment Variables
- No new env variables needed — existing `SMTP_PASS`, `DATABASE_URL` are reused

---

## Build Sequence

1. **DB migrations** — `ensure_*` functions for 5 new tables + ALTER columns on existing tables
2. **API routes** — 15 new endpoints added to `backend/main.py`
3. **Dashboard shell** — sidebar nav, notification bell, passcode lock, tab routing
4. **Dashboard Home** — stat cards + today's sessions + "Needs Attention" strip
5. **Notifications tab** — alert list, upcoming session countdowns, follow-ups due
6. **Leads tab** — unified 3-source view + status pipeline management
7. **Patients tab** — list + profile modal + Share Patient Brief
8. **Sessions tab** — calendar + add/edit modal + Share Call Details (email + WhatsApp + copy)
9. **Prescription Builder** — 4-section builder + preview + email send
10. **Plans tab** — service enrollment + progress tracking
11. **Polish** — notification auto-poll, browser push, animations, responsive, brand alignment

---

## Open Questions (Pending Answers)

1. **Who uses this dashboard?** Operations team only, or Dr. Jayashree also?
2. **Meeting links:** Manual paste vs. Calendly API auto-fetch?
3. **Prescription format:** Free-text notes, or structured builder (poses/breathing/nutrition)?
4. **WhatsApp sharing:** Email only, or also WhatsApp for prescriptions?
5. **Multiple coordinators:** Just Dr. Jayashree, or multiple team members?

---

*This plan covers all modules, DB schema, API routes, sharing features, notifications, deployment architecture, and build sequence for the Yoganteek Internal Operations Dashboard.*
