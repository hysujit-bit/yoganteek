# Yoganteek — Complete Project Reference

> **Client:** Dr. Jayashree Pattanayak  
> **Brand:** Yoganteek (yoganteek.com)  
> **Role:** Corporate Wellness Coach & Yoga Physician (PhD)  
> **Location:** Bannerghatta Road, Bengaluru, Karnataka  
> **Project Manager:** Sujit  
> **Last Updated:** 9 March 2026

---

## 1. Contact & Social Links

| Channel | Value |
|---------|-------|
| Email (Primary / CTA) | jspyoga1986@gmail.com |
| Email (Business) | yoganteekwellness@gmail.com |
| Phone | +91 797 831 1312 |
| WhatsApp | [wa.me/917978311312](https://wa.me/917978311312?text=Hi%20Dr.%20Jayashree%2C%20I%20am%20interested%20in%20your%20wellness%20programs.%20Could%20we%20schedule%20a%20consultation%3F) |
| Calendly | https://calendly.com/jspyoga1986/30min |
| Instagram | https://www.instagram.com/yoganteek_wellness/ |
| Facebook | https://www.facebook.com/profile.php?id=100064091137312# |
| LinkedIn | https://www.linkedin.com/in/dr-jayashree-pattanayak-0319791a1 |
| YouTube | *Hidden — re-enable when channel is active* |

---

## 2. Deliverables Produced

### 2.1 PDF — Corporate Wellness Portfolio
- **File:** `Dr_Jayashree_Corporate_Portfolio.pdf`
- **Generator:** `/home/claude/create_portfolio_v2.py` (Python / ReportLab)
- **Fonts:** Poppins (Regular/Bold/Medium/Light), Lora Variable — from `/usr/share/fonts/truetype/google-fonts/`
- **Colors:** PRIMARY `#0D7377`, PRIMARY_DARK `#0A5C5F`, PRIMARY_LIGHT `#E8F6F6`, ACCENT `#D4A853`, TEXT_DARK `#1A1A2E`, BG_CREAM `#FAFAF8`
- **Page size:** A4 (595×842 pts), 50pt side margins
- **6-page structure:** Cover → Expertise & Credentials → Client Experience → Programs & Services → Why Choose → Contact/CTA
- **Profile photo:** Circular-cropped (`/home/claude/profile_circle.png`)

### 2.2 HTML — Corporate Landing Page
- **File:** `Yoganteek_Corporate_Landing_Page.html`
- Full corporate wellness pitch with programs, client testimonials (Deloitte, SBI), stats, CTA
- Uses relative links to other pages (index.html, about.html, services.html, contact.html)
- Embedded SVG logo (base64), embedded profile photo (base64)
- All social & Calendly links active

### 2.3 DOCX — Corporate Portfolio
- **File:** `Dr_Jayashree_Portfolio.docx`
- **Generator:** `/home/claude/create_docx.js` (Node.js / docx package)
- Minor validation warning (border element ordering) — does not affect rendering

### 2.4 HTML — Portfolio
- **File:** `Dr_Jayashree_Portfolio.html`
- HTML version of the corporate portfolio

### 2.5 Website — 4-Page Site
- **Generator:** `/home/claude/generate_yoganteek_pages.py` (Python)
- **Files:** `index.html`, `about.html`, `services.html`, `contact.html`
- All cross-linked with consistent design system
- Corporate page linked from nav as 5th page

---

## 3. Website Design System

### 3.1 Color Palette

```css
:root {
    --sage: #7A8B6F;
    --sage-dark: #5C6B52;
    --sage-light: #E8EDE4;
    --sage-wash: #F4F6F2;
    --forest: #3D4F35;
    --cream: #FAF8F5;
    --cream-dark: #F0ECE6;
    --warm-brown: #8B7355;
    --warm-brown-light: #D4C4A8;
    --text-dark: #2C2C2C;
    --text-body: #555555;
    --text-light: #888888;
    --white: #FFFFFF;
    --accent-gold: #C4A265;
}
```

### 3.2 Typography
- **Headings:** `'Cormorant Garamond', Georgia, serif` — elegant serif
- **Body:** `'DM Sans', -apple-system, sans-serif` — clean modern sans
- Loaded via Google Fonts CDN

### 3.3 Design Language
- Earthy sage greens with warm cream backgrounds
- Rounded CTA buttons (border-radius: 30px)
- Fade-up scroll animations via IntersectionObserver
- Cards with subtle borders and hover lift effect
- Two-column layouts for content + visual pairing

### 3.4 Shared Components (All Pages)

**Top Bar** — Dark forest green (`--forest`), fixed at top:
- Left: email, phone, location
- Right: social media icons (IG, FB, LinkedIn, WhatsApp)

**Navigation** — Fixed below top bar, white with blur backdrop:
- SVG logo (left) + 5 links: Home, About, Services, Corporate, Contact
- Active state: `--sage-dark` with font-weight 600
- Scrolled state adds box-shadow

**Footer** — Cream background:
- Logo, navigation links, social icons, copyright
- "© 2025 Yoganteek. All rights reserved."

**CTA Section** — Gradient forest-to-sage background:
- White heading + subtitle + white CTA button
- Diagonal line overlay pattern

**Scroll Animations:**
- `.fade-up` class with IntersectionObserver
- Stagger delays: `.stagger-1` (0.1s), `.stagger-2` (0.2s), `.stagger-3` (0.3s)

### 3.5 Responsive Breakpoints
- `900px` — Collapse to single column, hide nav links, reduce font sizes
- `600px` — Further grid simplification

---

## 4. Assets & Images

| Asset | Source Path | Base64 Length | Notes |
|-------|------------|---------------|-------|
| SVG Logo | `/mnt/user-data/uploads/yoganteek_website_logo.svg` | 675,504 chars | Full Yoganteek wordmark with lotus icon. Colors: `#343f1e` / `#2b1654`. ViewBox: `0 0 194.88 52.5`. Embedded as `data:image/svg+xml;base64,...` in all pages |
| Profile Photo | `/mnt/user-data/uploads/Jayashree_Maa.jpeg` | 61,152 chars | Dr. Jayashree's portrait, embedded as base64 data URI |
| Hero Image | `/mnt/user-data/uploads/hero.jpg` | 154,740 chars | Forest meditation scene — intended as full-width hero background on Home page with dark gradient overlay |
| Circular Photo | `/home/claude/profile_circle.png` | — | Circular crop of profile photo, used in PDF |
| Extracted Photo | `/home/claude/img_prefix-004.jpg` | — | 1056×992 extracted profile photo |

---

## 5. Page Content — Detailed

### 5.1 Home (index.html)
- **Hero:** Full-width background image (`hero.jpg`) with dark gradient overlay, Dr. Jayashree's photo frame (rounded pill shape), headline "Start living your *healthiest* life", subtitle about wellness coaching, CTA buttons
- **Wellness Coaching Section:** Two-column — description + photo
- **Offerings Grid:** 4 cards with emoji placeholders:
  - 🥗 Personalized nutrition plans
  - ⚖️ Weight management counseling
  - 💆 Health and wellness coaching
  - 🧘 Expand spiritual knowledge
- **Guide Section:** "Your guide to better health — Dr. Jayashree Pattanayak" with bio
- **CTA:** "Begin Your Journey to Wellness"

### 5.2 About (about.html)
- **Hero:** "We care for *You*!"
- **Approach Section:** 4 cards — Yoga Anytime-Anywhere / Guidance / Online Classes / Disease Management
- **Healing Journeys:** Two-column content
- **Stats Row:** 3 stat cards — 92% happiness / 88% habit formation / 82% nutrition knowledge
- **Why Work With Us:** Mission statement + CTA
- **CTA:** "Begin Your Journey to Wellness"

### 5.3 Services (services.html)
- **Hero:** "Empowering your balanced, *fulfilling* life."
- **4 alternating service blocks** (image left/right swap):
  1. Personalized nutrition plans — ₹1,000
  2. Weight management counseling — ₹1,500
  3. Health and wellness coaching — ₹1,200
  4. Expand spiritual knowledge — ₹1,800
- Each block: title, price, 3 features (uppercase label + description), CTA button
- **CTA:** "Ready to Start Your Journey?"

### 5.4 Contact (contact.html)
- **Hero:** "Boost your health with *Yoga* & balanced nutrition."
- **Two-column layout:**
  - Left: Info cards (phone, email, location, WhatsApp) + social icons
  - Right: Contact form (name, email, message → alert on submit)
- **CTA:** "We'd Love to Hear From You" → Calendly link

### 5.5 Corporate (Yoganteek_Corporate_Landing_Page.html)
- Full corporate wellness pitch page
- Client testimonials: Deloitte, SBI
- Programs: Executive Stress Management, Desk Yoga, Mental Wellness, Team Building
- Stats, credentials, CTA sections
- Relative links to other 4 pages

---

## 6. Dr. Jayashree — Key Content

### 6.1 Credentials
- **PhD** Yoga Sciences — SVYASA / NIMHANS (2025)
- **M.Sc.** Yoga Sciences — Utkal University (2011)
- **AYUSH Certification** — Kaivalyadhama (Govt. of India)
- 2 peer-reviewed publications in JCDR (2025)
- 14+ years experience

### 6.2 Impact Stats
- 500+ professionals trained
- 30–40% stress reduction achieved
- 85% participation rate
- 92% reported increased happiness
- 88% sustainable habit formation
- 82% nutrition knowledge improvement

### 6.3 Key Clients
- **PayPal India** (2015–2018): 200+ IT professionals, 35% anxiety reduction
- **State Bank of India** (2018): 150+ employees, 80% participation
- **Deloitte India** (2022): 12-week structured program
- **Sears Holdings**: Corporate wellness

### 6.4 Programs (Corporate)
- Executive Stress Management (8–12 weeks)
- Desk Yoga for IT Teams (daily 30–45 min)
- Mental Wellness & Resilience (6–10 weeks)
- Team Building Wellness Retreats (1–3 days)

### 6.5 Services (Individual — from website)
- Personalized nutrition plans — from ₹1,000
- Weight management counseling — from ₹1,500
- Health & wellness coaching — from ₹1,200
- Spiritual knowledge expansion — from ₹1,800

---

## 7. Technical Notes

### 7.1 Logo Embedding
The SVG logo file is 506,627 bytes. It's embedded as a base64 data URI in all HTML pages to avoid external URL dependencies. Each page has 2 occurrences (nav + footer), except the corporate page which has 1.

**Data URI format:** `data:image/svg+xml;base64,PHN2ZyB4bWxucz0i...`

### 7.2 Photo Embedding
Dr. Jayashree's photo (`Jayashree_Maa.jpeg`) is embedded as base64 data URI in all HTML pages that display her portrait.

### 7.3 Hero Image
`hero.jpg` — forest meditation scene. Intended as `background: url(data:image/jpeg;base64,...) center center / cover no-repeat` on the Home page hero section, with a dark gradient overlay for text readability:
```css
background: linear-gradient(135deg,
    rgba(29,35,20,0.65) 0%,
    rgba(61,79,53,0.45) 40%,
    rgba(29,35,20,0.7) 100%);
```
Hero text should be white/gold on this dark overlay.

### 7.4 Generator Script
`/home/claude/generate_yoganteek_pages.py` — Python script that generates all 4 website pages. Key functions:
- `shared_css()` — Returns the full CSS design system (all variables, components, responsive rules)
- `top_bar()` — Dark forest green bar with contact info + social icons
- `nav(active_page)` — Fixed navigation with logo and 5 links
- `footer()` — Footer with logo, links, social, copyright
- `scripts()` — Scroll observer + nav shadow JS
- `page(title, active, body, extra_css)` — Assembles full HTML document

### 7.5 PDF Generator
`/home/claude/create_portfolio_v2.py` — Python/ReportLab script generating the 6-page corporate PDF portfolio.

### 7.6 DOCX Generator
`/home/claude/create_docx.js` — Node.js script using the `docx` npm package.

---

## 8. Pending / Next Steps

- [ ] **WordPress Integration:** A WordPress developer needs to integrate all HTML pages as pages on yoganteek.com
- [ ] **Hero Image Fix:** The Home page (index.html) CSS was partially corrupted during the hero background update — the shared CSS (:root, nav, footer, section styles, etc.) got stripped. Needs regeneration from the generator script with the hero background properly integrated
- [ ] **YouTube Link:** Hidden with `display:none` — re-enable when Dr. Jayashree's YouTube channel is active
- [ ] **Service Pricing:** Currently shown in ₹ (INR) — confirm if correct or should include $ pricing
- [ ] **Emoji Placeholders:** Service images currently use emojis (🥗⚖️💆🧘) — replace with actual photos when available
- [ ] **Contact Form:** Currently shows a JS alert on submit — needs backend integration for actual form submission
- [ ] **SEO & Meta Tags:** Add proper meta descriptions, Open Graph tags, structured data for each page
- [ ] **Favicon:** Add Yoganteek favicon/icon

---

## 9. File Inventory

### Output Files (shared with client)
```
/mnt/user-data/outputs/
├── Dr_Jayashree_Corporate_Portfolio.pdf    ← 6-page corporate PDF
├── Dr_Jayashree_Portfolio.html             ← HTML portfolio version
├── Dr_Jayashree_Portfolio.docx             ← Word doc portfolio
├── Yoganteek_Corporate_Landing_Page.html   ← Corporate wellness page
├── index.html                              ← Home page (⚠️ CSS needs fix)
├── about.html                              ← About page
├── services.html                           ← Services page
├── contact.html                            ← Contact page
├── Jayashree_Maa.jpeg                      ← Profile photo (copy)
├── hero.jpg                                ← Hero background image (copy)
└── yoganteek_website_logo.svg              ← SVG logo (copy)
```

### Working Files
```
/home/claude/
├── generate_yoganteek_pages.py             ← Main website generator (Python)
├── create_portfolio_v2.py                  ← PDF generator (ReportLab)
├── create_docx.js                          ← Word doc generator (Node.js)
├── img_prefix-004.jpg                      ← Extracted profile photo (1056×992)
└── profile_circle.png                      ← Circular-cropped photo for PDF
```

### Source Uploads
```
/mnt/user-data/uploads/
├── Jayashree_Maa.jpeg                      ← Original profile photo
├── hero.jpg                                ← Hero background image
└── yoganteek_website_logo.svg              ← Original SVG logo (506KB)
```

---

*This document serves as a complete reference for rebuilding, modifying, or extending any part of the Yoganteek project.*
