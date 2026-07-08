# Yoganteek - Implementation Plan (Batch 2)

> **Created:** 2026-07-08
> **Status:** All Tasks Completed
> **Tech Stack:** Static HTML + Tailwind CSS (CDN) | Python FastAPI (backend) | PostgreSQL on Neon DB | Raw psycopg2 (no ORM)

---

## Task 1: Contact Page Enquiries -> Separate `contact_submissions` Table

### Current State
- Contact form (`frontend/contact.html`) POSTs to `/api/leads`
- All form submissions (ad enquiry + contact) go into the same `leads` table
- The `leads` table has fields like `health_goal`, `concern`, `calendly_url` that are irrelevant for contact enquiries

### Goal
- Contact page submissions should go to a **new `contact_submissions` table** with relevant fields only
- Ad enquiry submissions continue using the `leads` table

### Implementation Steps

#### 1.1 Database - New Table
**File:** `backend/main.py` (add `ensure_contact_submissions_table()`) + `create_leads_table.sql`

```sql
CREATE TABLE IF NOT EXISTS contact_submissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100) DEFAULT 'contact-page',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
```

#### 1.2 Backend - New API Endpoint
**File:** `backend/main.py`

- Add Pydantic model `ContactSubmissionCreate` with fields: `name`, `email`, `phone`, `subject`, `message`
- Add `POST /api/contact-submissions` route
  - Inserts into `contact_submissions` table
  - Sends acknowledgement email (reuse existing `send_email` function)
  - Returns success response
- Add `GET /api/contact-submissions` route (for admin viewing)
- Update `ensure_tables()` to call `ensure_contact_submissions_table()`

#### 1.3 Frontend - Update Contact Form
**File:** `frontend/contact.html`

- Change the fetch URL from `/api/leads` to `/api/contact-submissions`
- Update the request body to match the new model (`name`, `email`, `phone`, `subject`, `message`)
- Remove the mapping of subject -> `health_goal` (keep subject as-is)

### Files to Modify
| File | Change |
|---|---|
| `backend/main.py` | Add table creation, Pydantic model, 2 API routes |
| `frontend/contact.html` | Update fetch URL and request body |
| `create_leads_table.sql` | Add `contact_submissions` table DDL (for reference) |

---

## Task 2: Add Policy Pages (Privacy Policy, Terms & Conditions, Refund Policy)

### Current State
- **No policy pages exist** anywhere in the codebase
- Footer has links but no policy links

### Goal
- Create static HTML policy pages matching the existing site design
- Add links in the footer across all pages

### Implementation Steps

#### 2.1 Create Policy Pages
Create 3 new static HTML files in `frontend/`:

| File | Page Title | Content Focus |
|---|---|---|
| `privacy-policy.html` | Privacy Policy | Data collection, usage, storage, cookies, third-party sharing, user rights (GDPR-aligned) |
| `terms-conditions.html` | Terms & Conditions | Service terms, booking rules, intellectual property, liability limitations |
| `refund-policy.html` | Refund Policy | Cancellation terms, refund eligibility, process, timeline |

Each page should include:
- Standard nav bar (copy from any existing page like `about.html`)
- Hero/title section
- Content section with sections/sections
- Standard footer (copy from any existing page)
- Same Tailwind CSS CDN setup

#### 2.2 Add Footer Links
**Files:** All HTML files in `frontend/` that have a footer

Add a "Policies" column or section in the footer with links:
```html
<h4>Policies</h4>
<a href="/privacy-policy.html">Privacy Policy</a>
<a href="/terms-conditions.html">Terms & Conditions</a>
<a href="/refund-policy.html">Refund Policy</a>
```

**Approach:** Update the footer in `index.html`, then copy the updated footer to all other pages. Or update `components/footer.html` if it's actively used.

### Files to Create/Modify
| File | Action |
|---|---|
| `frontend/privacy-policy.html` | **CREATE** |
| `frontend/terms-conditions.html` | **CREATE** |
| `frontend/refund-policy.html` | **CREATE** |
| All existing HTML pages | **MODIFY** footer to add policy links |

---

## Task 3: Add Blog Section to Home Page

### Current State
- Home page (`frontend/index.html`) has sections: Hero, Wellness Coaching, Offerings, FAQ, CTA, Footer
- Blog index page exists at `frontend/blog.html` with 4 blog articles
- The **ad enquiry page** (`Yoganteek_ad_enquiry.html`) already has a blog section with 4 cards
- Home page currently has **NO blog section**

### Goal
- Add a "Latest from our Blog" section on the home page showing recent blog posts
- Match the design style used in the ad enquiry page's blog section

### Implementation Steps

#### 3.1 Add Blog Section to Home Page
**File:** `frontend/index.html`

Insert a new section before the CTA section (between FAQ and CTA):

```html
<!-- Blog Section -->
<section class="py-16 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Latest from our Blog</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <!-- 4 blog cards matching ad enquiry page style -->
    </div>
    <div class="text-center mt-10">
      <a href="/blog.html" class="inline-block border-2 border-purple-700 text-purple-700 px-8 py-3 rounded-full ...">View All Articles</a>
    </div>
  </div>
</section>
```

Blog cards will link to:
1. `blog-be-concentric.html`
2. `blog-stress-management.html`
3. `blog-yoga-for-kids.html`
4. `blog-yoga-for-women.html`

#### 3.2 Reuse Existing Design
- Copy the blog card markup from `Yoganteek_ad_enquiry.html` (lines ~580-640)
- Adjust colors/styling to match the home page theme
- Use existing blog thumbnail images or Unsplash placeholders

### Files to Modify
| File | Change |
|---|---|
| `frontend/index.html` | Add blog section HTML between FAQ and CTA sections |

---

## Task 4: Add Quote Section in Yoganteek_Ad_enquiry Page

### Current State
- `Yoganteek_ad_enquiry.html` has sections: Hero, Floating Form, How It Works, Experts, CTA, Testimonials, Blog, FAQ, Final CTA
- There is **no dedicated quote/testimonial highlight section**
- The ad enquiry page already has a testimonials carousel with 10 WhatsApp reviews

### Goal
- Add a prominent **quote section** (inspirational/motivational quote about yoga/wellness)
- This is different from testimonials — it's a standalone motivational quote to build trust and emotional connection

### Implementation Steps

#### 4.1 Add Quote Section
**File:** `frontend/Yoganteek_ad_enquiry.html`

Insert a new section, ideally between "How It Works" and "Our Experts" (or after Testimonials):

```html
<!-- Quote Section -->
<section class="py-16 bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <svg class="w-12 h-12 mx-auto mb-6 opacity-50" ...><!-- quote icon --></svg>
    <blockquote class="text-2xl md:text-3xl font-light italic leading-relaxed mb-6">
      "Yoga is not about touching your toes. It's about what you learn on the way down."
    </blockquote>
    <cite class="text-lg opacity-80">- Jigar Gor</cite>
  </div>
</section>
```

#### 4.2 Design Considerations
- Use a gradient background (purple/indigo to match brand)
- Large italic text for the quote
- Optional: Add a subtle quote icon (SVG)
- Responsive: smaller text on mobile, larger on desktop
- Consider making it a rotating carousel with 3-5 quotes (if desired)

### Files to Modify
| File | Change |
|---|---|
| `frontend/Yoganteek_ad_enquiry.html` | Add quote section HTML |

---

## Implementation Order (Recommended)

| Phase | Task | Estimated Effort | Dependencies |
|---|---|---|---|
| **Phase 1** | Task 4: Quote section in ad enquiry page | ~30 min | None (frontend only) |
| **Phase 2** | Task 3: Blog section on home page | ~30 min | None (frontend only) |
| **Phase 3** | Task 1: Contact submissions table | ~1-1.5 hrs | Backend + DB + Frontend changes |
| **Phase 4** | Task 2: Policy pages | ~1.5-2 hrs | Content writing + HTML creation + footer updates across all pages |

> **Note:** Tasks 3 & 4 are pure frontend (fast). Task 1 requires backend + DB changes. Task 2 is the most labor-intensive due to content + multi-file footer updates.

---

## Risk Checklist

- [ ] Contact form backward compatibility — ensure old leads endpoint still works for ad enquiry
- [ ] Policy page content accuracy — consult legal/business requirements before finalizing text
- [ ] Footer consistency — all pages must get the updated footer with policy links
- [ ] Mobile responsiveness — all new sections must work on mobile
- [ ] Email notifications — contact submissions should trigger acknowledgement emails
- [ ] Database migration — `contact_submissions` table must be created before deploying backend changes

---

## Verification Steps

After implementation, verify:

1. **Contact form:** Submit form on `/contact.html` -> data appears in `contact_submissions` table -> email received
2. **Ad enquiry:** Submit form on `/Yoganteek_ad_enquiry.html` -> data still goes to `leads` table (no regression)
3. **Home page blog:** Blog section visible with 4 cards, all links work
4. **Ad enquiry quote:** Quote section visible, responsive, styled correctly
5. **Policy pages:** All 3 pages load, content is accurate, footer links work on every page
6. **Footer:** All pages have updated footer with policy links
7. **Lint check:** No broken HTML, all images load, all links resolve
