# High-Converting Ad Landing Page Implementation Plan

This document outlines the plan for building a new, highly optimized landing page designed to convert ad traffic into consultation bookings, using a modern React & Python stack with a custom booking system designed to accommodate future payment integration.

## User Review Required
Please review the new architectural approach, the custom booking system, the future payment workflow, and the open questions. Your approval is needed before we begin coding.

## Open Questions
> [!IMPORTANT]
> 1. **Hosting Environment:** You mentioned you have cPanel. While cPanel is great for static HTML/PHP, running a **Python (FastAPI/Flask)** backend and a **React** application requires a different environment (like Heroku, Render, Vercel, or a VPS) or specific cPanel extensions. Where do you plan to host this new React + Python application?
> 2. **Calendar Business Hours:** For the custom booking system, what are Dr. Jayashree's available hours and days for consultations? (e.g., Mon-Fri, 10 AM to 5 PM, 30-minute slots).
> 3. **Form Layout:** You mentioned "Form should be divide in to two vertical parts." Do you mean a side-by-side 2-column layout on desktop, or a 2-step form where they click "Next" to see the second half of the questions?
> 4. **Problem Dropdown:** Could you provide the list of options you want in the "Problem" dropdown menu?
> 5. **Payment Provider:** Do you have a preferred payment provider in mind for the future (e.g., Razorpay, Stripe, PayPal)? This helps us structure the database correctly now.

## Proposed Architecture

### 1. Technology Stack
*   **Frontend:** React (built with Vite for speed) using Tailwind CSS or custom CSS for styling.
*   **Backend:** Python (FastAPI is recommended for high performance and easy API creation).
*   **Database:** Neon DB (PostgreSQL). We will use an ORM like SQLAlchemy to interact with the database.

### 2. Frontend: New Landing Page (React)
We will create a new React application following conversion rate optimization (CRO) best practices.

**Section Structure:**
- **Hero Section:** Strong, benefit-driven headline, subheadline, and a clear call-to-action (CTA) button that smoothly scrolls to the form.
- **Social Proof / As Seen In:** Logos of trusted partners or a banner of trust indicators.
- **The Problem & Solution:** Briefly highlight the pain points the target audience faces and how Yoganteek solves them.
- **Steps / How It Works:** A simple 3-step process (e.g., 1. Fill the Form, 2. Book Consultation, 3. Start Healing). *Note: We will design this so step 2 can easily become "Make Payment" in the future.*
- **Testimonials:** Real success stories.
- **Interactive Lead Form:** The core section of the page.
- **FAQ:** Addressing common objections.

### 3. Interactive Form, Custom Booking System & Future Payments
The user flow is designed modularly so a payment step can be slotted in seamlessly later.

**Step 1: Lead Details (The Form)**
*   First Name, Last Name, Email, Mobile no, Address
*   Profession, Problem (Dropdown), Details (Text area)
*   How do you know about us?, Age, Gender, Marriage Status
*   Any Existing Disease that you are getting treated?

**[FUTURE STEP] Step 2: Payment Gateway**
*   *In the future, the UI will transition to a payment checkout page (e.g., Razorpay/Stripe) here.*
*   *The backend will verify the payment webhook before unlocking the calendar.*

**Step 3 (Currently Step 2): Custom Booking UI**
1. The frontend fetches available time slots from the Python backend for the selected date.
2. The user selects a time slot and confirms.
3. The backend saves the appointment to the Neon DB `appointments` table.

### 4. Database Schema (Neon DB)
We will build the schema to be future-proof for payments:
*   **`leads`**: Stores all the form data collected in Step 1. We will add a `payment_status` column (defaulting to 'pending' or 'not_required' for now) and a `transaction_id` column.
*   **`appointments`**: Stores `id`, `lead_id` (foreign key), `appointment_date`, `appointment_time`, and `status`.

## Verification Plan
### Automated Tests
- Create unit tests for the Python backend to ensure time slot availability is calculated correctly and double-bookings are prevented.

### Manual Verification
- Verify the React landing page layout is fully responsive.
- Test form validation by attempting to submit empty or invalid data.
- Submit a test lead to ensure data correctly populates in the Neon DB `leads` table.
- Test the custom booking system to ensure slots are booked correctly and saved to the `appointments` table.
