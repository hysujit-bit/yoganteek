# Yoganteek Post-Deployment Bug Fix Plan

## Status: ALL FIXES IMPLEMENTED ✅ (Frontend + Backend)

---

## Bug Summary

### Bug 1 & 3: Consultation popup broken on 8 of 12 pages

**Root cause:** `booking-modal.js` (defines `window.openBookingModal`) only included on 4 pages, but CTAs calling `openBookingModal()` exist on all 13 pages.

Pages WITH `booking-modal.js` (popup works):
- `index.html` (line 667)
- `blog.html` (line 312)
- `Yoganteek_Corporate_Landing_Page.html` (line 969)
- `Yoganteek_ad_enquiry.html` (line 1372)

Pages MISSING `booking-modal.js` (popup broken):
- `services.html`
- `faq.html`
- `contact.html`
- `about.html`
- `blog-yoga-for-kids.html`
- `blog-stress-management.html`
- `blog-be-concentric.html`
- `blog-yoga-for-women.html`

All CTAs on these 8 pages throw: `ReferenceError: openBookingModal is not defined`

### Bug 2: Corporate consultation request form doesn't work

**File:** `Yoganteek_Corporate_Landing_Page.html` (lines 925-939)

**Root cause:** Fetch response handling has 3 issues:
1. No `r.ok` check — 4xx/5xx errors silently consumed
2. Catch block shows success anyway — user sees "Thank You!" even when API fails
3. No user-facing error feedback — spinner resets but no error message

**Backend:** `/api/corporate-inquiries` endpoint in `backend/main.py:226` is correct, schema matches.

---

## Fix Plan

### Fix 1 — Add `booking-modal.js` to 8 missing pages

Add before `</body>` on each page:
```html
<script src="./components/booking-modal.js"></script>
```

Files to edit:
1. `frontend/services.html`
2. `frontend/faq.html`
3. `frontend/contact.html`
4. `frontend/about.html`
5. `frontend/blog-yoga-for-kids.html`
6. `frontend/blog-stress-management.html`
7. `frontend/blog-be-concentric.html`
8. `frontend/blog-yoga-for-women.html`

### Fix 2 — Fix corporate form response handling

In `Yoganteek_Corporate_Landing_Page.html`, replace fetch chain (lines 925-939) with:
- Check `r.ok` before `.json()`
- Show error state on API failure (reset spinner, show error message)
- Only show success when backend confirms `success: true`

### Fix 3 — Backend: Add `ensure_leads_table()` + startup health check

Added to `backend/main.py`:
- `ensure_leads_table()` function — creates `leads` table if it doesn't exist (same pattern as `ensure_corporate_table()`)
- Startup DB connection test — logs CRITICAL error if Neon DB is unreachable
- Both tables auto-created on startup: `leads` then `corporate_inquiries`
- No changes to existing endpoints — `POST /api/leads`, `GET /api/leads`, `POST /api/corporate-inquiries`, `GET /api/corporate-inquiries` all untouched

---

## Key Files

- Frontend root: `D:\SUJIT\PROJETCS\yoganteek\frontend`
- Backend root: `D:\SUJIT\PROJETCS\yoganteek\backend`
- Booking modal component: `frontend/components/booking-modal.js`
- Corporate form: `frontend/Yoganteek_Corporate_Landing_Page.html`
- Corporate API endpoint: `backend/main.py` — `POST /api/corporate-inquiries`
- Leads API endpoint: `backend/main.py` — `POST /api/leads`

---

## Implementation Order

1. Fix 1: Add `booking-modal.js` to all 8 missing pages (quick, high impact)
2. Fix 2: Fix corporate form error handling
3. Test all pages for popup functionality
4. Test corporate form submission end-to-end
