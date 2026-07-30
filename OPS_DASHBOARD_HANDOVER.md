# Yoganteek Operations Dashboard — Progress & Handover Document

> **Last Updated:** 2026-07-30  
> **Status:** Phase 2 (Frontend) ~85% Complete | Custom Booking System Built | Google Calendar Integration Pending  
> **Project:** Yoganteek Internal Operations Dashboard (`ops.yoganteek.com`)

---

## 📌 Executive Summary

We are building a browser-based, password-protected **Internal Operations Dashboard** for Yoganteek's operational team. The system handles the full patient/lead lifecycle — from first enquiry through consultation, ongoing care, and communication.

The architecture is **separated yet integrated**:
- **Public Site:** `yoganteek.com` (hosted on cPanel)
- **Ops Dashboard:** Deployed on Vercel (custom domain `ops.yoganteek.com`)
- **Backend API:** FastAPI hosted on Render (`yoganteek-api.onrender.com`)
- **Database:** Neon PostgreSQL (single shared database)

**Key Decision:** We replaced Calendly with a **custom booking system** built into the platform. This gives full control, zero monthly cost, and direct database integration.

---

## ✅ What Has Been Completed

### Phase 1 — Backend (`backend/main.py`)

#### Database Tables (Auto-Created on Startup)
| Table | Purpose |
|-------|---------|
| `leads` | Website form submissions (with ops columns: status, coordinator, notes, follow_up_date) |
| `contact_submissions` | Contact page form submissions (with ops columns) |
| `corporate_inquiries` | Corporate landing page inquiries (with ops columns) |
| `patients` | Full patient profiles (demographics, medical history, health goals) |
| `sessions` | Consultation calendar & tracker (date/time, meeting links, status) |
| `prescriptions` | Care plan builder records (yoga, breathing, nutrition JSON) |
| `patient_plans` | Service enrollment & payment tracking |
| `notifications` | Smart alert queue (auto-generated) |
| `bookings` | **NEW** — Public booking system records (date/time, patient info, status, assigned doctor) |

#### API Endpoints (25+ Endpoints)

**Public-Facing:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/leads` | Create lead from website form |
| POST | `/api/corporate-inquiries` | Create corporate inquiry |
| POST | `/api/contact-submissions` | Create contact form submission |
| POST | `/api/bookings` | **NEW** — Create public booking |
| GET | `/api/availability` | **NEW** — Get available time slots for a date |

**Ops Dashboard:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/dashboard/stats` | Aggregated stats + today's sessions |
| PUT | `/api/leads/{id}/status` | Update lead status/notes/coordinator |
| POST | `/api/patients` | Create patient (from lead conversion) |
| GET | `/api/patients` | List all patients |
| POST | `/api/sessions` | Schedule session |
| GET | `/api/sessions` | List sessions (with filters) |
| POST | `/api/prescriptions` | Create prescription |
| POST | `/api/prescriptions/{id}/send` | Email prescription to patient |
| GET | `/api/bookings` | **NEW** — List all bookings |
| PUT | `/api/bookings/{id}` | **NEW** — Update/reschedule booking |
| DELETE | `/api/bookings/{id}` | **NEW** — Cancel booking |
| POST | `/api/leads/{id}/log-consultation` | **NEW** — Manual consultation logging |
| POST | `/api/calendly-booking` | **NEW** — Auto-capture from Calendly redirect (for future use) |
| GET/PUT | `/api/notifications` | Fetch & manage notifications |

#### Email Builders (4 Branded HTML Emails)
1. `build_session_share_email()` — Meeting link + details to patient
2. `build_session_reminder_email()` — 24h/1h before session
3. `build_prescription_email()` — Care plan HTML to patient
4. `build_patient_brief_email()` — Internal brief to team member

---

### Phase 2 — Frontend React PWA (`ops-dashboard/`)

#### Completed Components

| Component | File | Status | Features |
|-----------|------|--------|----------|
| **PasscodeGuard** | `src/components/common/PasscodeGuard.jsx` | ✅ Complete | SHA-256 auth, localStorage persistence, passcode: `Yoganteek2026!` |
| **AppLayout** | `src/components/layout/AppLayout.jsx` | ✅ Complete | Desktop sidebar + mobile bottom nav + notification bell drawer |
| **Dashboard Home** | `src/components/dashboard/DashboardHome.jsx` | ✅ Complete | 4 stat cards, "Needs Attention" banner, Today's Sessions, Upcoming Sessions, Lead Pipeline |
| **Bookings Module** | `src/components/bookings/BookingsModule.jsx` | ✅ Complete | **NEW** — View/edit/reschedule/cancel bookings, assign doctors |
| **Leads Module** | `src/components/leads/LeadsModule.jsx` | ✅ Complete | Unified 3-source table, status pipeline, "Convert to Patient", **"Log Consultation"** button |
| **Patients Module** | `src/components/patients/PatientsModule.jsx` | ✅ Complete | Patient directory, add patient, profile modal, "Share Patient Brief" email |
| **Sessions Module** | `src/components/sessions/SessionsModule.jsx` | ✅ Complete | **Upcoming/Past/All tabs**, 12-hour time format, share call details (Email/WhatsApp/Copy) |
| **Prescription Builder** | `src/components/prescriptions/PrescriptionBuilder.jsx` | ⚠️ 75% | 3 of 4 tabs working (Yoga, Breathing, Lifestyle). **Nutrition Plan tab missing** |
| **Plans Module** | `src/components/plans/PlansModule.jsx` | ✅ Complete | Enrollments with progress bars, payment badges |
| **Notifications Module** | `src/components/notifications/NotificationsModule.jsx` | ✅ Complete | Full tab, priority filtering, auto-polling every 60 seconds |

#### Infrastructure

| File | Status | Purpose |
|------|--------|---------|
| `src/services/api.js` | ✅ Complete | All API endpoints mapped (including new bookings endpoints) |
| `src/context/AuthContext.jsx` | ✅ Complete | Passcode authentication |
| `src/context/NotificationContext.jsx` | ✅ Complete | 60s auto-poll, document title badge |
| `src/index.css` | ✅ Complete | Full design system (Yoganteek branding) |
| `src/App.jsx` | ✅ Complete | Tab routing with Bookings tab added |

---

### Public Booking System (Custom Calendly Replacement)

#### Files Created
| File | Purpose |
|------|---------|
| `frontend/book-consultation.html` | **Public booking page** — 3-step flow: Pick Date/Time → Fill Details → Confirmation |
| `frontend/booking-confirmed.html` | Thank You page (Calendly redirect fallback) |

#### How the Booking Page Works
1. **Step 1:** Visitor picks a date from calendar → Sees available 30-min time slots
2. **Step 2:** Visitor fills name, email, phone, health goal
3. **Step 3:** Booking confirmed → Record saved to `bookings` table → Lead auto-created → Notification sent to ops team

#### Availability Logic
- **Working Hours:** Mon-Sat, 10:00 AM – 5:00 PM IST
- **Slot Duration:** 30 minutes
- **Slots:** 10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 1:00, 1:30, 2:00, 2:30, 3:00, 3:30, 4:00, 4:30
- **Booked slots** automatically marked unavailable
- **Sundays** blocked

---

## 🔄 Current Booking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  VISITOR JOURNEY                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. yoganteek.com/book-consultation.html                        │
│     → Picks date → Sees available slots                         │
│                                                                  │
│  2. Fills form (name, email, phone, health goal)                │
│     → Clicks "Confirm Booking"                                  │
│                                                                  │
│  3. Backend:                                                     │
│     a. Creates booking in `bookings` table ✅                   │
│     b. Auto-creates lead in `leads` table ✅                    │
│     c. Creates notification for ops team ✅                     │
│     d. Checks slot availability (prevents double-booking) ✅    │
│                                                                  │
│  4. Visitor sees confirmation page                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  OPS TEAM JOURNEY                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Notification received: "New Booking Received"               │
│                                                                  │
│  2. Bookings Tab shows new booking:                             │
│     Priya Sharma | Aug 5 10:00 AM | Confirmed | No link        │
│                                                                  │
│  3. Team clicks "Edit" to:                                      │
│     - Assign a doctor                                           │
│     - Add Google Meet link                                      │
│     - Reschedule if needed                                      │
│     - Add internal notes                                        │
│                                                                  │
│  4. Session appears in Sessions tab with meeting link           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔴 What's NOT Done / Needs Attention

### Must Fix
| Item | Priority | Notes |
|------|----------|-------|
| **Nutrition Plan Tab** in PrescriptionBuilder.jsx | Medium | Tab 3 not rendered — needs `nutritionPlan` state + UI |
| **Deploy all changes** | High | Backend, frontend, and booking page need deployment |
| **Test end-to-end booking flow** | High | Verify booking page → backend → dashboard works |

### Phase 2B — Google Calendar Integration (Optional Enhancement)
| Item | Priority | Notes |
|------|----------|-------|
| Google Cloud project setup | Low | User needs to create project, enable Calendar API |
| Service Account credentials | Low | User needs to create and download JSON key |
| Backend: Google Calendar polling | Low | Auto-fetch meeting links from calendar |
| Backend: Auto-create Google Meet links | Low | When booking is made, create event in calendar |

### Future Enhancements
| Item | Notes |
|------|-------|
| Email reminders (24h/1h before) | Already have email builders, need cron job trigger |
| PWA manifest + Service Worker | Not yet implemented |
| Settings module (passcode change, team) | Not started |
| Calendar view for Sessions | Currently only list view |

---

## 📁 Key Reference Files

| File | Location |
|------|----------|
| Master Plan | `OPS_DASHBOARD_PLAN.md` |
| Backend Code | `backend/main.py` |
| Ops Dashboard | `ops-dashboard/src/` |
| Public Booking Page | `frontend/book-consultation.html` |
| Thank You Page | `frontend/booking-confirmed.html` |
| Project Structure | `PROJECT_STRUCTURE.md` |

---

## 🚀 Deployment Checklist

### Backend (Render)
- [ ] Push `backend/main.py` to GitHub
- [ ] Verify Render auto-deploys
- [ ] Verify `bookings` table is created (check Render logs)

### Public Booking Page (cPanel)
- [ ] Push `frontend/book-consultation.html` to GitHub
- [ ] Verify GitHub Actions deploys to cPanel
- [ ] Test `yoganteek.com/book-consultation.html`

### Ops Dashboard (Vercel)
- [ ] Push `ops-dashboard/` to GitHub
- [ ] Verify Vercel auto-deploys
- [ ] Test all tabs (Bookings, Leads, Sessions, etc.)

### Website Updates
- [ ] Replace old Calendly booking button with link to `book-consultation.html`
- [ ] Update any Calendly references in footer/header

---

## 🧪 Testing Checklist

- [ ] Visit `book-consultation.html` → See calendar with available slots
- [ ] Pick a date → Available time slots load correctly
- [ ] Fill form → Confirm booking → See confirmation
- [ ] Check Ops Dashboard → Bookings tab → See new booking
- [ ] Click Edit → Reschedule → Change status → Add meeting link
- [ ] Check Leads tab → See auto-created lead from booking
- [ ] Check Dashboard Home → See updated stats
- [ ] Check Notifications → See "New Booking Received" alert
- [ ] Test on mobile → Responsive design works

---

## 📝 Notes for Next Session

1. **API URL:** Backend is at `yoganteek-api.onrender.com` (verified)
2. **Passcode:** `Yoganteek2026!` (or `yoganteek`)
3. **Database:** Neon PostgreSQL (shared with public site)
4. **Calendly:** No longer needed — replaced by custom booking system
5. **Google Calendar:** Integration built — needs environment variables on Render
6. **Mock data:** All removed — dashboard shows real data from database
7. **Booking page:** Works independently of Calendly — pure custom implementation

---

## 🔗 Google Calendar Integration — Setup Complete

### What Was Built
- `GET /api/google-calendar/sync` — Fetches events from Google Calendar, auto-creates/updates bookings with Google Meet links
- `GET /api/google-calendar/status` — Checks if integration is configured

### Environment Variables to Set on Render

Go to Render Dashboard → Your Backend Service → Environment tab → Add these:

| Variable | Value |
|----------|-------|
| `GOOGLE_CALENDAR_ID` | `yoganteekwellness@gmail.com` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | (paste the entire JSON content from the key file) |

**For `GOOGLE_SERVICE_ACCOUNT_JSON`, paste the entire JSON content from the downloaded key file.**
It should look like this structure (but with your actual key):
```
{"type":"service_account","project_id":"yoganteeek-booking-system","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...your key here...\n-----END PRIVATE KEY-----\n","client_email":"yoganteek-calendar@yoganteeek-booking-system.iam.gserviceaccount.com",...}
```

> **IMPORTANT:** Do NOT commit the JSON key file to Git. Keep it local and paste directly into Render.

### Also Set on Render (for new dependency)
Render auto-installs from `requirements.txt`, so `google-api-python-client` and `google-auth` will be installed automatically on next deploy.

### How It Works
1. Ops team clicks "Sync Calendar" in the Bookings tab
2. Backend fetches events from `yoganteekwellness@gmail.com` calendar (next 7 days)
3. For each event:
   - If matching booking exists (by date/time) → Updates meeting link
   - If no match → Creates new booking with Google Meet link
4. Meeting links appear in Bookings tab and Sessions tab

### Important: Share Calendar with Service Account
Before the sync works, you must share your Google Calendar with the service account:
1. Go to calendar.google.com → Settings → Your calendar → "Share with specific people"
2. Add: `yoganteek-calendar@yoganteeek-booking-system.iam.gserviceaccount.com`
3. Permission: "Make changes to events"

---

*This document captures the complete state of the Yoganteek Ops Dashboard project as of 2026-07-30.*
