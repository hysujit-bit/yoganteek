# Yoganteek Operations Dashboard — Progress & Handover Document

> **Date:** 2026-07-27  
> **Status:** Phase 1 (Backend) Complete | Ready for Phase 2 (Frontend)  
> **Project:** Yoganteek Internal Operations Dashboard (`ops.yoganteek.com`)

---

## 📌 Executive Summary

We are building a browser-based, password-protected **Internal Operations Dashboard** for Yoganteek's operational team and Dr. Jayashree Pattanaik. 

The architecture is **separated yet integrated**:
- **Public Site:** `yoganteek.com` (hosted on cPanel)
- **Ops Dashboard:** `ops.yoganteek.com` (deployed to `/public_html/ops/` on cPanel)
- **Backend API:** FastAPI hosted on Render (single shared API for site & ops)
- **Database:** Neon PostgreSQL (single shared database for site & ops)

---

## ✅ What Has Been Completed (Phase 1 — Backend)

The full backend implementation in `backend/main.py` has been completed and written to disk.

### 1. Database Schema & Auto-Migrations (`ensure_*` functions)
All database tables and columns are automatically created on backend startup:
- **`patients`** — Full patient profiles (demographics, medical history, health goals, assigned coordinator, status, source lead reference).
- **`sessions`** — Consultations calendar & tracker (date/time, meeting links, duration, status, notes, reminder tracking).
- **`prescriptions`** — Care plan builder records (yoga routine JSON, breathing exercises JSON, nutrition plan JSON, lifestyle tips, additional notes, sent timestamp).
- **`patient_plans`** — Service enrollment & payment tracking (service name, plan type, start/end dates, total & completed sessions, amount paid, payment status).
- **`notifications`** — Smart alert queue (type, priority, title, message, related item reference, read status).
- **Ops tracking on lead tables** — Added `status`, `coordinator`, `notes`, `follow_up_date` to `leads`, `contact_submissions`, and `corporate_inquiries`.

### 2. Email Builders (Branded HTML via SMTP)
Added 4 new branded HTML email generator functions matching Yoganteek's sage green/cream design system:
1. `build_session_share_email()` — Sends meeting link, date/time, duration, coordinator name, and prep instructions to patients.
2. `build_session_reminder_email()` — Auto-sent reminders 24 hours and 1 hour before scheduled sessions.
3. `build_prescription_email()` — Generates structured HTML care plans (Yoga, Breathing, Nutrition, Lifestyle) and emails them to patients.
4. `build_patient_brief_email()` — Formatted internal brief emailed to team members prior to consultations.

### 3. API Endpoints (15 New Endpoints in `backend/main.py`)

| Category | Method & Endpoint | Purpose |
|----------|-------------------|---------|
| **Dashboard** | `GET /api/dashboard/stats` | Returns stat cards (open leads, active patients, sessions today, pending follow-ups), today's session list, and lead pipeline counts. |
| **Lead Ops** | `PUT /api/leads/{id}/status`<br>`PUT /api/corporate-inquiries/{id}/status`<br>`PUT /api/contact-submissions/{id}/status` | Updates lead stage (`new` → `contacted` → `consultation_booked` → `converted`), notes, coordinator, and follow-up date. |
| **Patients** | `POST /api/patients`<br>`GET /api/patients`<br>`GET /api/patients/{id}`<br>`PUT /api/patients/{id}`<br>`POST /api/patients/{id}/share-brief` | Create, list, fetch detailed profile (with linked sessions/plans/rx), update patient, and email internal brief to a team member. |
| **Sessions** | `POST /api/sessions`<br>`GET /api/sessions`<br>`PUT /api/sessions/{id}`<br>`POST /api/sessions/{id}/share` | Schedule sessions, list/filter by date/upcoming, update status/notes/links, and email call details + meeting link to patient. |
| **Prescriptions** | `POST /api/prescriptions`<br>`GET /api/prescriptions`<br>`POST /api/prescriptions/{rx_id}/send` | Create draft care plans, list prescriptions, and send branded HTML care plan via email to patient. |
| **Plans** | `POST /api/patient-plans`<br>`GET /api/patient-plans` | Create and track patient service enrollments & payment progress. |
| **Notifications** | `GET /api/notifications`<br>`PUT /api/notifications/{id}/read`<br>`PUT /api/notifications/read-all`<br>`POST /api/notifications/generate` | Fetch alerts, mark read, and auto-generate notifications (upcoming sessions, follow-ups due, new leads, draft Rx reminders, and send 24h/1h email reminders). |

---

## 🎯 Next Step (Phase 2 — Frontend React & Node PWA)

The frontend single-page application is built as a modern **React + Node Progressive Web App (PWA)** inside **`ops-dashboard/`** for hosting on **Vercel**.

### Detailed Master Plan Reference
Please read **`OPS_DASHBOARD_PLAN.md`** at the project root for full design system details, UI layout requirements, PWA settings, and feature specs.

### Core Modules to Build in Frontend (`ops-dashboard/`):
1. **Passcode Lock Screen (`PasscodeGuard.jsx`)** — In-page SHA-256 passcode guard with `localStorage` persistence.
2. **App Shell & Dual Navigation (`AppLayout.jsx`)** — Dark forest green desktop sidebar (`#3D4F35`) + mobile bottom navbar + top header with Notification Bell drawer.
3. **Module 1: Dashboard Home (`DashboardHome.jsx`)** — 4 stat cards, "Needs Attention" alert banner, "Today's Sessions" list with one-click Zoom/Meet launch & share buttons, lead pipeline visualization.
4. **Module 2: Leads & Enquiries (`LeadsModule.jsx`)** — Tabbed/unified table of Website Leads, Ad Enquiries, and Corporate Inquiries with status dropdowns, follow-up date pickers, notes, and "Convert to Patient" modal.
5. **Module 3: Patients (`PatientsModule.jsx`)** — Patient table, new patient modal, and slide-over Patient Profile (showing health goals, medical history, session history, active plan, prescriptions, and "Share Patient Brief" email button).
6. **Module 4: Sessions / Calendar (`SessionsModule.jsx`)** — Calendar/list schedule view, Add Session modal (patient picker, date/time, meeting link), and "Share Call Details" modal (Email / WhatsApp / Copy Link).
7. **Module 5: Prescription Builder (`PrescriptionBuilder.jsx`)** — 4-tab builder (Yoga, Breathing, Nutrition, Lifestyle) + Live Preview Card + "Send Email to Patient" action.
8. **Module 6: Services & Plans (`PlansModule.jsx`)** — Active enrollments list with progress bars (`sessions_completed` / `sessions_total`) and payment status badges.
9. **Module 7: Notifications (`NotificationsModule.jsx`)** — Top notification drawer + full alert tab with countdown timers, priority filters, and auto-polling every 60 seconds.
10. **Module 8: PWA & Vercel Config (`manifest.json`, `vercel.json`)** — App shell manifest, service worker caching, and SPA redirect routing for Vercel.

---

## 📁 Key Reference Files

- Master Design & Functional Plan: [`OPS_DASHBOARD_PLAN.md`](file:///d:/SUJIT/PROJETCS/yoganteek/OPS_DASHBOARD_PLAN.md)
- Complete Backend API Code: [`backend/main.py`](file:///d:/SUJIT/PROJETCS/yoganteek/backend/main.py)
- Project Structure Reference: [`PROJECT_STRUCTURE.md`](file:///d:/SUJIT/PROJETCS/yoganteek/PROJECT_STRUCTURE.md)
