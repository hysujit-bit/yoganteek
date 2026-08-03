# Yoganteek Ops Dashboard — Project State (Aug 2026)

## Overview
Internal operations dashboard for Yoganteek wellness platform. Password-protected, manages leads, patients, bookings, sessions, prescriptions, plans, groups, and notifications.

## Architecture

| Layer | Tech | URL |
|-------|------|-----|
| Frontend (Public) | React + Vite | https://yoganteek.com |
| Frontend (Ops) | React + Vite | https://yoganteek.vercel.app |
| Backend | FastAPI + psycopg2 | https://yoganteek-api.onrender.com |
| Database | Neon PostgreSQL | `postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/Yoganteek?sslmode=require` |
| Hosting | cPanel (public), Vercel (ops), Render (backend) | |

**Ops Dashboard Passcode:** `Yoganteek2026!`

## Key Concepts
- **Bookings** = consultation calls (pre-conversion, auto-synced from Google Calendar). Separate `bookings` table.
- **Sessions** = post-conversion patient care (individual or group). `sessions` table with optional `group_id`.
- **Groups** = organize patients into recurring yoga sessions (e.g., "Morning Yoga Group" on Mon/Wed/Fri at 6:15 AM).
- Calendly flow does NOT capture phone numbers — leads table is the only source of phone data.
- Google Meet auto-generation does NOT work on personal Gmail accounts.
- Google Calendar Service Account: `yoganteek-calendar@yoganteeek-booking-system.iam.gserviceaccount.com`
- Calendar ID: `yoganteekwellness@gmail.com`

## Backend Startup Migrations (auto-run)
Tables created/migrated on backend startup in `backend/main.py`:
1. `leads` — lead capture from website
2. `patients` — converted patients
3. `sessions` — individual/group sessions (has `group_id` FK)
4. `prescriptions` — patient prescriptions
5. `patient_plans` — subscription plans
6. `notifications` — in-app notifications
7. `bookings` — Google Calendar sync (consultations)
8. `patient_activities` — patient journey timeline
9. `patient_notes` — notes on timeline
10. `groups` — group yoga sessions (has `session_time`, `weekdays`)
11. `group_members` — patient-group membership (many-to-many)

## Backend API Endpoints

### Core
- `POST /api/auth/verify` — passcode auth
- `GET /api/dashboard/stats` — aggregated dashboard data + today's sessions (joins groups)
- `POST /api/keepalive` — prevent Render cold starts

### Leads
- `GET /api/leads?type=all|leads|contact|corporate` — UNIONs all 3 tables with `type` field
- `PUT /api/leads/{id}` — update lead
- `POST /api/leads/{id}/convert` — convert lead to patient
- `GET /api/leads/{id}/journey` — lead journey timeline

### Patients
- `GET /api/patients` — list all
- `POST /api/patients` — create
- `GET /api/patients/{id}` — full profile (sessions, plan, prescriptions, activities)
- `PUT /api/patients/{id}` — update
- `GET /api/patients/{id}/activities` — timeline activities
- `POST /api/patients/{id}/activities` — add note
- `DELETE /api/patients/{id}/activities/{activity_id}` — delete note
- `POST /api/patients/{id}/backfill-activities` — backfill from existing data

### Sessions
- `GET /api/sessions?upcoming=bool` — JOINs groups for `group_name`, `group_meeting_link`
- `POST /api/sessions` — create (supports `group_id` for group sessions)
- `PUT /api/sessions/{id}` — update (date, time, status, meeting_link, notes)
- `POST /api/sessions/{id}/share` — share session details

### Groups
- `GET /api/groups` — list with member_count, session_time, weekdays
- `POST /api/groups` — create (name, description, meeting_link, coordinator, session_time, weekdays)
- `PUT /api/groups/{id}` — update any field
- `DELETE /api/groups/{id}` — delete group
- `GET /api/groups/{id}/members` — list members (returns id, name, email, phone)
- `POST /api/groups/{id}/members` — add patients (`patient_ids` array)
- `DELETE /api/groups/{id}/members/{patient_id}` — remove member

### Prescriptions
- `GET /api/prescriptions` — list all
- `POST /api/prescriptions` — create
- `POST /api/prescriptions/{id}/send` — send via WhatsApp/email

### Patient Plans
- `GET /api/patient-plans` — list all
- `POST /api/patient-plans` — create

### Notifications
- `GET /api/notifications?unread=bool` — list
- `PUT /api/notifications/{id}/read` — mark read
- `PUT /api/notifications/read-all` — mark all read

### Google Calendar
- `GET /api/calendar/sync-status` — sync status
- `POST /api/calendar/full-sync` — full sync
- `POST /api/calendar/keepalive` — keep calendar alive

## Frontend Structure

```
ops-dashboard/src/
├── components/
│   ├── auth/LoginPage.jsx
│   ├── common/ (Badge, Modal, StatCard, Toast)
│   ├── dashboard/DashboardHome.jsx
│   ├── patients/PatientsModule.jsx (with PatientJourneyTimeline)
│   ├── bookings/BookingsModule.jsx
│   ├── sessions/SessionsModule.jsx (with Groups tab)
│   ├── leads/LeadsModule.jsx
│   ├── prescriptions/PrescriptionsModule.jsx
│   └── layout/Sidebar.jsx
├── hooks/useSortableData.js
├── services/api.js
├── utils/share.js (navigator.share + clipboard fallback)
├── sw.js (PWA service worker)
├── manifest.json
├── icon-192.svg, icon-512.svg
└── App.jsx, main.jsx
```

## Frontend Features Implemented

### Dashboard (DashboardHome)
- 4 stat cards: Open Leads, Active Patients, Today's Sessions, Follow-ups
- Smart banner: shows urgency based on next session time (critical/warning/info)
- Today's sessions list with group_name display for group sessions
- Pipeline breakdown, recent leads, recent patients

### Leads Module
- Tabs: All Sources / Leads / Contact / Corporate (UNION query with `type` field)
- Badge colors: green (leads), amber (contact), blue (corporate)
- Lead detail modal with full profile
- Convert to Patient action
- Share button (copy to clipboard / mobile native share)
- Sort by any column

### Patients Module
- Search/filter by name, email, phone
- Status filter (all/active/inactive)
- Patient detail modal with full profile
- Patient Journey Timeline (slide-out drawer)
  - Color-coded icons for different activity types
  - Add/delete notes
  - Auto-generated from sessions/prescriptions/plans
- Share button

### Bookings Module
- Tabs: Upcoming / Past / All
- Past tab includes `no_show` and `rescheduled`, excludes past dates from upcoming
- Share button

### Sessions Module
- **Sessions tab**: Upcoming/Past/All sub-tabs
  - Desktop table + mobile cards
  - Shows group_name with icon for group sessions
  - **Edit button** on each session (date, time, duration, status, meeting link, notes)
  - Share button
- **Groups tab**: Grid of group cards
  - Shows member count, session time, weekdays
  - Schedule Session button (uses group's default time)
  - Manage button opens detail modal
  - **Group Detail Modal**: members list, add/remove members, edit group, delete group
  - **Edit Group Modal**: name, description, meeting link, coordinator, session time, weekdays (WeekdayPicker)
  - **Add Members Modal**: checkbox list of patients
- **Create Group Modal**: name, description, meeting link, coordinator, session time, weekdays
- **WeekdayPicker**: toggle buttons for Sun-Sat

### Prescriptions Module
- List all prescriptions
- Create new prescription
- Send via WhatsApp/email

### PWA
- `sw.js` — cache-first for static, network-first for API
- `manifest.json` — installable
- SVG icons (192x192, 512x512)

### Share Utility (`utils/share.js`)
- Mobile: `navigator.share()` native share sheet
- Desktop: clipboard fallback with toast

## Group Session Flow
1. Create group (e.g., "Morning Yoga Group") with session_time=06:15, weekdays="mon,wed,fri"
2. Add patients to group
3. Click "Schedule Session" on group card → creates session at group's session_time
4. Session appears in Sessions tab with group_name and group icon
5. Can edit session time/date individually via Edit button
6. Group settings (time/weekdays) are templates for future sessions

## Known Issues / Future Work
- Dashboard "Today's Sessions" pulls from `sessions` table only — empty if no sessions scheduled yet (all data in `bookings`)
- Google Meet links don't auto-generate on personal Gmail
- Calendly doesn't capture phone numbers
- No recurring session auto-creation (currently manual per-session)

## Git History (Recent)
- `a85c596` — fix: Use group's default time when scheduling + add session edit
- `5435eac` — feat: Add session time & weekday schedule to groups
- `34e398d` — fix: group members not showing - field name mismatch
- `ce8750b` — feat: Groups feature - session grouping with member management
- `5c54a71` — previous state

## How to Resume
1. Frontend auto-deploys on push to `master` via Vercel
2. Backend must be manually redeployed on Render after `backend/main.py` changes
3. Run `npm install && npm run dev` in `ops-dashboard/` for local dev
4. Backend local: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload`
