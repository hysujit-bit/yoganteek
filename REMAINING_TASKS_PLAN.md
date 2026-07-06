# Yoganteek - Remaining Tasks Plan

## Task 1: Common Header & Footer Across All Pages

### Current State
- `index.html` loads header/footer dynamically via `components/loader.js` (XHR into `<div id="site-header/footer">`)
- **All other 11 pages** have the header & footer **copy-pasted inline** with minor variations
- `Yoganteek_ad_enquiry.html` is a complete outlier with different nav structure (`.hamburger` class, no `data-page`, "Contact" instead of "Blog")
- Every page carries dead CSS: old `.nav`, `.nav-logo`, `.nav-burger`, `.top-bar` styles that are never used in the HTML
- Footer logo varies: `index.html` uses `./assets/logo.svg` with filter, others use base64-encoded SVG

### Target State
- **All pages use `components/loader.js`** to load shared header (`components/header.html`) and footer (`components/footer.html`)
- Remove inlined header/footer HTML from all 11 pages
- Remove dead CSS from all pages
- Single source of truth: edit header/footer once, all pages update

### Implementation Steps

**Step 1: Normalize `Yoganteek_ad_enquiry.html` nav**
- Replace the unique `.hamburger` / `#hamburger-btn` nav with the standard `#main-nav` + `#menu-btn` pattern from `components/header.html`
- Add `data-page` attributes to nav links
- Replace "Contact" nav link with "Blog" (or keep both if needed)
- Wire "Book Consultation" CTA to `openBookingModal()`
- Add `<script src="./components/booking-modal.js"></script>`

**Step 2: Refactor all 11 non-index pages to use `loader.js`**
- Pages: `about.html`, `services.html`, `contact.html`, `faq.html`, `blog.html`, `blog-*.html` (4), `Yoganteek_Corporate_Landing_Page.html`, `Yoganteek_ad_enquiry.html`
- For each page:
  - Remove the entire inlined `<nav>` block and its associated `<style>` block for header
  - Remove the entire inlined `<footer>` block and its associated `<style>` block
  - Add `<div id="site-header"></div>` after `<body>`
  - Add `<div id="site-footer"></div>` before `</body>`
  - Add `<script src="./components/loader.js"></script>` at the end
  - Remove old dead CSS (`.nav`, `.nav-logo`, `.nav-burger`, `.top-bar` styles)
  - Keep only page-specific styles in `<style>` blocks

**Step 3: Verify `components/loader.js` works for all pages**
- `loader.js` injects Tailwind CDN + config — confirm no conflicts
- `loader.js` fires `componentsLoaded` event — pages can listen if needed
- Test that inline scripts in loaded header (scroll, mobile menu, active page) execute properly

**Step 4: Update `components/footer.html` logo path**
- Ensure logo references `./assets/logo.svg` consistently (not base64)

---

## Task 2: Corporate & Contact Forms → Neon DB + Acknowledgement Email

### Current State
- **Contact page** (`contact.html`) has a form → submits to `POST /api/leads` with fields mapped as `subject→health_goal`, empty `concern`
- **Corporate page** has **NO form** — all CTAs call `openBookingModal()` which uses the booking-modal.js (form → Calendly flow)
- Backend (`backend/main.py`) has a single `/api/leads` endpoint that inserts into the `leads` table
- No acknowledgement email is sent
- `leads` table schema: `id, name, email, phone, health_goal, concern, message, calendly_url, created_at`

### Target State
- **Corporate page** gets its own dedicated form with corporate-specific fields
- **Contact form** gets properly attributed (not mapping subject→health_goal)
- Both forms submit to Neon DB with correct field mapping
- **Acknowledgement email** sent after each successful submission
- Corporate flow is **different** from regular booking (no Calendly, corporate inquiries are handled differently)

### Implementation Steps

**Step 1: Design corporate-specific form fields**
Corporate inquiries need different data than personal consultations:
- Company Name (required)
- Contact Person Name (required)
- Work Email (required)
- Phone Number (required)
- Number of Employees (select: 1-10, 11-50, 51-200, 200+)
- Preferred Program (select: Yoga Sessions, Meditation, Wellness Workshops, Custom Package)
- Preferred Schedule (select: Weekly, Bi-weekly, Monthly, One-time)
- Message / Special Requirements (textarea)

**Step 2: Update Neon DB schema**
Add a new `corporate_inquiries` table (or extend `leads` table):
```sql
CREATE TABLE corporate_inquiries (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  employee_count VARCHAR(50),
  preferred_program VARCHAR(100),
  preferred_schedule VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Alternatively, add a `type` column to existing `leads` table with values `personal` or `corporate`, plus extra columns for corporate-specific fields.

**Step 3: Update backend API (`backend/main.py`)**
- Add `POST /api/corporate-inquiries` endpoint
- Add `CorporateInquiryCreate` Pydantic model
- Add acknowledgement email function (using `smtplib` or a service like SendGrid/Mailgun)
- Email template: "Thank you for your corporate wellness inquiry, {contact_name}. We'll get back to you within 24 hours."
- Add email sending to both `/api/leads` and `/api/corporate-inquiries` handlers

**Step 4: Update contact form mapping**
- Keep contact form as-is but fix the field mapping
- Instead of mapping `subject→health_goal`, store `subject` properly or add a `subject` column
- Send acknowledgement email on contact form submission

**Step 5: Build corporate form in `Yoganteek_Corporate_Landing_Page.html`**
- Create a dedicated form section on the corporate page
- Form submits to `POST /api/corporate-inquiries`
- On success: show thank-you message (no Calendly redirect)
- On failure: fallback to localStorage + show retry option

**Step 6: Update `booking-modal.js` to send acknowledgement email**
- Option A: Send email from backend after `/api/leads` succeeds (recommended)
- Option B: Frontend calls a separate `/api/send-email` endpoint

---

## Task 3: Responsive Checks Across All Devices

### Current State
- Breakpoints used: `600px`, `639px`, `640px`, `768px`, `900px` — inconsistent
- Top bar hidden on mobile via `display: none !important` everywhere
- Mobile menu uses `max-height: 0/420px` transition
- Grids collapse to single column on mobile
- Booking modal goes full-screen on mobile
- `Yoganteek_ad_enquiry.html` has its own responsive patterns

### Target State
- Consistent breakpoints across all pages
- All pages pass mobile (375px), tablet (768px), and desktop (1280px+)
- No horizontal overflow on any page
- All interactive elements (buttons, links, forms) are tap-friendly (min 44px touch target)
- Images scale properly without layout shift

### Implementation Steps

**Step 1: Standardize breakpoints**
Use Tailwind's default breakpoints consistently:
- `sm: 640px` — large phones
- `md: 768px` — tablets
- `lg: 1024px` — small desktops
- `xl: 1280px` — large desktops

**Step 2: Fix known responsive issues per page**

| Page | Known Issues |
|------|-------------|
| `index.html` | Needs check — hero, offerings grid, testimonials |
| `about.html` | Timeline section, team grid |
| `services.html` | Service cards grid, pricing cards |
| `contact.html` | Form 2-column → 1-column, contact info cards |
| `faq.html` | Accordion behavior on mobile |
| `blog.html` | Blog card grid |
| `blog-*.html` | Article content, images |
| Corporate page | Hero, form layout, partner logos |
| Ad enquiry page | Hero, form steps, testimonials |

**Step 3: Systematic responsive audit**
For each page, check at these widths:
- **375px** (iPhone SE) — smallest practical mobile
- **390px** (iPhone 14) — standard mobile
- **768px** (iPad) — tablet
- **1024px** (laptop) — small desktop
- **1280px+** (desktop) — full desktop

Check for:
- Horizontal scroll/overflow
- Text readability (min 14px body text)
- Button/link tap targets (min 44px)
- Image scaling
- Form usability
- Navigation functionality
- Footer layout

**Step 4: Fix identified issues**
- Add missing responsive styles
- Fix any overflow issues
- Ensure consistent spacing
- Test hamburger menu on mobile
- Test booking modal on mobile (full-screen behavior)

---

## Execution Order

1. **Task 1 first** — Common header/footer (foundation for everything else)
2. **Task 2 second** — Corporate/contact forms + email (backend + frontend)
3. **Task 3 last** — Responsive checks (after structural changes are done)

## Files to Modify

### Task 1
- `frontend/components/header.html` — may need minor tweaks
- `frontend/components/loader.js` — verify it works for all pages
- `frontend/components/footer.html` — ensure logo path consistency
- `frontend/about.html` — remove inlined header/footer, add loader
- `frontend/services.html` — remove inlined header/footer, add loader
- `frontend/contact.html` — remove inlined header/footer, add loader
- `frontend/faq.html` — remove inlined header/footer, add loader
- `frontend/blog.html` — remove inlined header/footer, add loader
- `frontend/blog-be-concentric.html` — remove inlined header/footer, add loader
- `frontend/blog-stress-management.html` — remove inlined header/footer, add loader
- `frontend/blog-yoga-for-kids.html` — remove inlined header/footer, add loader
- `frontend/blog-yoga-for-women.html` — remove inlined header/footer, add loader
- `frontend/Yoganteek_Corporate_Landing_Page.html` — remove inlined header/footer, add loader
- `frontend/Yoganteek_ad_enquiry.html` — normalize header, add loader

### Task 2
- `backend/main.py` — add corporate endpoint + email
- `backend/requirements.txt` — add email dependency if needed
- `frontend/Yoganteek_Corporate_Landing_Page.html` — add corporate form
- `frontend/contact.html` — fix form field mapping
- `frontend/components/booking-modal.js` — (optional) add email trigger

### Task 3
- All `frontend/*.html` files — responsive fixes
- `frontend/components/booking-modal.js` — mobile tweaks if needed
