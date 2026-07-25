# Yoganteek – Project Structure Guide

> **Last updated:** 2026-07-24  
> **Purpose:** Document the active project structure to avoid confusion between root-level legacy files and the actual deployed codebase.

---

## Active Directories

| Directory | Purpose | Deployed to Production |
|-----------|---------|----------------------|
| `frontend/` | All HTML pages, CSS, JS, assets, and components | **Yes** – via GitHub Actions → cPanel |
| `backend/` | FastAPI server (`main.py`) | **Yes** – hosted on Render |
| `.github/workflows/` | CI/CD deployment pipelines | N/A (runs on GitHub) |

---

## ⚠️ Important: `frontend/` is the ONLY Active Source

**All production code lives in `frontend/`.** The root-level HTML files, Python scripts, and other files at the project root were **legacy artifacts** from development and are **NOT used in production**.

### Historical note
- Root HTML files (`index.html`, `about.html`, etc.) were the **original versions** before the project was restructured into the `frontend/` folder.
- Root Python scripts were **one-time migration tools** used to refactor headers, footers, and add Tailwind CSS.
- These files have been cleaned up and removed from the repository (as of 2026-07-24).

### Deployment pipeline
The GitHub Actions workflow (`deploy-frontend.yml`) runs:
```bash
cd frontend
# uploads only frontend/ files to cPanel
```
**No root-level files are deployed.**

---

## Files to KEEP (actively used)

### `frontend/` directory (the live site)
```
frontend/
├── index.html              # Home page
├── about.html              # About page
├── contact.html            # Contact page
├── services.html           # Services page
├── blog.html               # Blog listing
├── blog-*.html             # Individual blog posts
├── faq.html                # FAQ page
├── feedback.html           # Feedback page
├── privacy-policy.html     # Privacy policy
├── terms-conditions.html   # Terms & conditions
├── refund-policy.html      # Refund policy
├── Yoganteek_ad_enquiry.html        # Ad enquiry landing page
├── Yoganteek_Corporate_Landing_Page.html  # Corporate landing page
├── components/
│   ├── header.html         # Shared header (loaded by loader.js)
│   ├── footer.html         # Shared footer (loaded by loader.js)
│   ├── booking-modal.js    # Booking modal with Calendly integration
│   └── loader.js           # Loads shared components
├── assets/                 # Images, logos, favicons
└── fix_booking.py          # Utility to add booking-modal.js to pages
```

### `backend/` directory
```
backend/
├── main.py                 # FastAPI server (leads API)
└── requirements.txt        # Python dependencies
```

### Root files that should stay
| File | Reason |
|------|--------|
| `.cpanel.yml` | Required for cPanel Git deployment integration |
| `.gitignore` | Git configuration |
| `.gitattributes` | Git configuration |
| `.github/workflows/*` | CI/CD pipelines |
| `1. Pull Yoganteek.ps1` | Dev convenience script (git pull) |
| `2. Run Yoganteek.ps1` | Dev convenience script (local server) |
| `3. Push Yoganteek.ps1` | Dev convenience script (git push) |
| `create_leads_table.sql` | Database schema reference |

---

## Documentation/Planning Files (KEEP as reference)

| File | Content |
|------|---------|
| `DEPLOYMENT.md` | Deployment guide for cPanel + Render |
| `Yoganteek_Project_Reference.md` | Master project reference (client info, colors, links) |
| `BUG-FIX-PLAN.md` | Historical bug fix documentation |
| `implementation_plan_Architecture.md` | Original architecture plan |
| `implementation_plan_batch_2.md` | Batch 2 feature plan |
| `REMAINING_TASKS_PLAN.md` | Component architecture task plan |
| `New LP & FOrm Implementation_plan.md` | Earlier planning document |
| `WHATSAPP_AUTOMATION.md` | WhatsApp automation planning (in progress) |
| `Yoganteek_FAQs_Final.docx` | FAQ content reference |

---

## Quick Reference

### What to edit when making changes
| Task | Edit file in |
|------|-------------|
| Home page | `frontend/index.html` |
| About page | `frontend/about.html` |
| Contact page | `frontend/contact.html` |
| Services page | `frontend/services.html` |
| Blog pages | `frontend/blog*.html` |
| Booking modal | `frontend/components/booking-modal.js` |
| Shared header | `frontend/components/header.html` |
| Shared footer | `frontend/components/footer.html` |
| Backend API | `backend/main.py` |

### What NOT to edit
- Any `.html` file at the project root (not deployed)
- Any `.py` utility script at the root (one-time migration tools)

---

*This file exists to prevent future confusion between legacy root-level files and the active `frontend/` + `backend/` codebase.*
