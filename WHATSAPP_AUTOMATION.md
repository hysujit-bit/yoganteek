# 📱 WhatsApp Automation — Yoganteek Wellness
> **LLM Context Reference** | Keep this file updated as the system evolves.  
> **Last Updated:** July 24, 2026 | **Status:** 🟡 In Progress — Phase 3: Backend Code  
> **API Method:** Meta Cloud API (Official, Free)

---

## 🏗️ Architecture

```
[yoganteek.com Forms]
        │
        ▼
[FastAPI Backend — main.py]  ◄── Hosted on Render
        │
        ├──► [Neon PostgreSQL]      — leads/inquiries stored
        ├──► [Gmail SMTP]           — email acknowledgement (existing)
        └──► [Meta Cloud API]       — WhatsApp messages ✅ NEW
                    │
                    ├──► Lead's phone      (welcome + info message)
                    ├──► Owner phone       (new lead alert to Dr. Jayashree)
                    └──► Webhook endpoint  (receive & auto-reply to incoming)

[Calendly] ──webhook──► [/webhook/calendly]  ──► WhatsApp booking confirmation
```

---

## 🔑 Environment Variables

> Set in **Render Dashboard → yoganteek-api → Environment**

| Variable | Description | Value |
|----------|-------------|---------------|
| `WA_PHONE_NUMBER_ID` | Meta Phone Number ID (from API Setup page) | `1269162839607220` ✅ |
| `WA_BUSINESS_ACCOUNT_ID` | WhatsApp Business Account ID | `100971938524825` ✅ |
| `WA_ACCESS_TOKEN` | Meta System User permanent token | `EAAZB5t6lJbf0BSByPzOFH6JFCwVI9unREquZCPzpPZAZB1tZCpcO3Rg9WzsDplv4cg1S4uwKq6tncd1JZBKLrsOhYf6MZBvGTs63IKxb0miY4MZAxweYJjpbGtBQer6uibP5MA2NFJ4YfPqjktuL9EY7s1d16XYI6T3G612SN7NvEmuflr7UacVL3yFOObT6M61c2QZDZD` ✅ |
| `WA_WEBHOOK_VERIFY_TOKEN` | Secret for Meta webhook verification | `yoganteek_wa_2026` |
| `OWNER_WHATSAPP` | Dr. Jayashree's number for lead alerts | `919078419107` |
| `DATABASE_URL` | Neon PostgreSQL (already set) | `postgresql://...` |
| `SMTP_HOST` | `smtp.gmail.com` (already set) | — |
| `SMTP_USER` | `yoganteekwellness@gmail.com` (already set) | — |
| `SMTP_PASS` | Gmail App Password (already set) | — |

---

## 📡 API Endpoints

### Existing Endpoints (live on Render)
| Method | Path | Triggers |
|--------|------|---------|
| POST | `/api/leads` | DB save + email |
| GET | `/api/leads` | Fetch all leads |
| POST | `/api/corporate-inquiries` | DB save + email |
| GET | `/api/corporate-inquiries` | Fetch all corporate |
| POST | `/api/contact-submissions` | DB save + email |
| GET | `/api/contact-submissions` | Fetch all contact |

### New WhatsApp Endpoints (to be added)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/webhook/whatsapp` | Meta webhook verification (challenge-response) |
| POST | `/webhook/whatsapp` | Receive incoming WA messages + trigger auto-reply |
| POST | `/webhook/calendly` | Calendly booking/cancellation → WA reminder |

---

## 💬 WhatsApp Message Templates

> **IMPORTANT:** Templates must be pre-approved by Meta (~24h).  
> Templates are required for first-contact outbound messages.  
> Free-text replies only allowed within 24h of user's last incoming message.

### Template 1: `lead_welcome` (Category: UTILITY)
**Trigger:** New lead submits inquiry form  
**Recipient:** Lead's phone number  
```
🙏 Namaste {{1}}! Thank you for reaching out to Yoganteek Wellness by Dr. Jayashree Pattanaik.

We've received your inquiry and will get back to you within 24 hours.

📅 Book a session: https://calendly.com/jspyoga1986/30min
📞 Call: +91 797 831 1312

Reply STOP to unsubscribe.
```
**Variables:** `{{1}}` = lead name

---

### Template 2: `corporate_welcome` (Category: UTILITY)
**Trigger:** Corporate inquiry form submitted  
**Recipient:** Corporate contact phone  
```
🏢 Hi {{1}}, thank you for your corporate wellness inquiry for {{2}}!

Dr. Jayashree's team is preparing a customized proposal. You'll hear from us within 24 hours.

📞 Urgent? Call: +91 797 831 1312
📧 yoganteekwellness@gmail.com

Reply STOP to unsubscribe.
```
**Variables:** `{{1}}` = contact name, `{{2}}` = company name

---

### Template 3: `appointment_reminder` (Category: UTILITY)
**Trigger:** Calendly webhook `invitee.created`  
**Recipient:** Person who booked  
```
⏰ Hi {{1}}, your wellness session with Dr. Jayashree is confirmed for {{2}}.

📍 Online / Bannerghatta Road, Bengaluru

To reschedule: https://calendly.com/jspyoga1986/30min

Reply STOP to unsubscribe.
```
**Variables:** `{{1}}` = name, `{{2}}` = formatted date/time

---

## 🤖 Auto-Reply Bot Logic

When users send incoming messages to the business WA number:

| Keywords | Bot Response |
|---------|-------------|
| `hi`, `hello`, `namaste` | Welcome menu (4 options) |
| `book`, `appointment`, `session` | Calendly link |
| `price`, `cost`, `fee`, `rate` | Service pricing + website URL |
| `corporate`, `company`, `b2b` | Corporate page link + contact info |
| `stop`, `unsubscribe` | Opt-out confirmation |
| *(anything else)* | "Our team will respond shortly" + phone |

---

## 🚀 Meta Developer Setup — Step-by-Step Guide

> **Two different numbers are used — this is normal and correct:**

| Role | Number | Purpose |
|------|--------|---------|
| Facebook/Meta Login | Your existing FB-linked number | 2FA for your personal Meta account |
| WhatsApp Business API | `+91 90085 80255` | Sends/receives WhatsApp messages |

> ⚠️ **`+91 90085 80255` must NOT have an active WhatsApp app** on it. ✅ Confirmed — it does not.

---

### Step 1 — Create Meta Developer Account

1. Go to → **https://developers.facebook.com/**
2. Click **"Get Started"** (top right)
3. Log in using your **existing Facebook account** (uses your FB-linked number for 2FA — that's fine)
4. Accept the Meta Developer Terms
5. Verify your account with the OTP sent to your **FB-linked number** (NOT the WhatsApp business number)

✅ Developer account created. The mobile number here is just for your Meta login — it has nothing to do with WhatsApp.

---

### Step 2 — Create a Meta Business App

1. Go to → **https://developers.facebook.com/apps/**
2. Click **"Create App"**
3. Choose **"Business"** as the app type
4. Fill in:
   - **App Name:** `Yoganteek Wellness`
   - **App Contact Email:** `yoganteekwellness@gmail.com`
   - **Business Portfolio:** Select your business or create one
5. Click **"Create App"**

---

### Step 3 — Add WhatsApp Product to App

1. Inside your new app dashboard, scroll down to **"Add Products to Your App"**
2. Find **WhatsApp** → click **"Set Up"**
3. You'll now see **WhatsApp → Getting Started** in the left sidebar

---

### Step 4 — Add & Verify Business Phone Number

> This is where `+91 90085 80255` enters the picture.

1. Go to **WhatsApp → API Setup** in the left sidebar
2. Under **"Step 5: Add a phone number"**, click **"Add phone number"**
3. Fill in:
   - **Display Name:** `Yoganteek Wellness`
   - **Category:** `Health & Beauty` (or `Education`)
   - **Phone number:** `+91 90085 80255`
   - **Verify via:** SMS (recommended) or Voice Call
4. Enter the OTP received on `90085 80255`
5. ✅ Number verified and added!

> 📌 **After this, note down:**
> - **Phone Number ID** (shown on the API Setup page)
> - **WhatsApp Business Account ID** (shown above it)

---

### Step 5 — Generate Permanent Access Token

> The temporary token on the API Setup page expires in 24 hours. You need a permanent one.

1. Go to → **https://business.facebook.com/settings/system-users**
2. Click **"Add"** → Create a System User:
   - **Name:** `yoganteek-api-user`
   - **Role:** `Admin`
3. Click on the new system user → **"Generate New Token"**
4. Select your app (`Yoganteek Wellness`)
5. Under permissions, enable:
   - `whatsapp_business_messaging` ✅
   - `whatsapp_business_management` ✅
6. Click **"Generate Token"** → **Copy and save this token immediately** (it won't show again)

> 🔐 This is your `WA_ACCESS_TOKEN` — store it in Render's environment variables.

---

### Step 6 — Set Render Environment Variables

Once you have the credentials, add these in **Render → yoganteek-api → Environment**:

```
WA_PHONE_NUMBER_ID   = <Phone Number ID from Step 4>
WA_ACCESS_TOKEN      = <Permanent token from Step 5>
WA_WEBHOOK_VERIFY_TOKEN = yoganteek_wa_2026
OWNER_WHATSAPP       = 919008580255
```

---

### Step 7 — Register Webhook (After Code Deployment)

> Do this AFTER the `/webhook/whatsapp` endpoint is live on Render.

1. Go to **App Dashboard → WhatsApp → Configuration**
2. Under **Webhook**, click **"Edit"**
3. Set:
   - **Callback URL:** `https://yoganteek-api.onrender.com/webhook/whatsapp`
   - **Verify Token:** `yoganteek_wa_2026`
4. Click **"Verify and Save"**
5. Subscribe to **`messages`** webhook field ✅

---

### Step 8 — Submit Message Templates

1. Go to → **https://business.facebook.com/wa/manage/message-templates/**
2. Click **"Create Template"** for each template in the section above
3. Wait ~24 hours for Meta approval
4. Test with the test number Meta provides on the API Setup page

---

## 📋 Meta Cloud API — Technical Details

- **API Base URL:** `https://graph.facebook.com/v18.0/`
- **Send Message Endpoint:** `POST /{PHONE_NUMBER_ID}/messages`
- **Auth Header:** `Authorization: Bearer {WA_ACCESS_TOKEN}`
- **Phone format:** No `+`, no spaces. India numbers: `91XXXXXXXXXX`
- **Messaging product:** Always `"whatsapp"`
- **WhatsApp Business Number:** `+91 90085 80255` (Yoganteek Wellness)

### Send Text Message (JSON body)
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "text",
  "text": { "body": "Hello from Yoganteek! 🙏" }
}
```

### Send Template Message (JSON body)
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "lead_welcome",
    "language": { "code": "en" },
    "components": [{
      "type": "body",
      "parameters": [{ "type": "text", "text": "Ramesh" }]
    }]
  }
}
```

---

## 📁 Code File Map

| File | Role |
|------|------|
| `backend/main.py` | FastAPI app — all endpoints + WA/email functions |
| `backend/requirements.txt` | Python deps — needs `httpx` added |
| `backend/render.yaml` | Render deployment + env var keys |
| `WHATSAPP_AUTOMATION.md` | ← This file (LLM context reference) |
| `Yoganteek_Project_Reference.md` | Overall project reference |

---

## 🔧 Functions in `main.py` (After Implementation)

| Function | Type | Description |
|----------|------|-------------|
| `send_whatsapp(phone, message)` | `async def` | Core WA text sender via Meta API |
| `send_whatsapp_template(phone, template, params)` | `async def` | Template message sender |
| `wa_lead_message(name, goal)` | `def` | Returns lead welcome text |
| `wa_corporate_message(name, company)` | `def` | Returns corporate welcome text |
| `wa_owner_notification(name, phone, concern)` | `def` | Returns owner alert text |
| `send_email(to, name, subject, html)` | `def` | Existing (unchanged) |

---

## 🔗 Meta Dashboard Quick Links

| Resource | URL |
|----------|-----|
| App Dashboard | https://developers.facebook.com/apps/ |
| WhatsApp Manager | https://business.facebook.com/wa/manage/ |
| Message Templates | https://business.facebook.com/wa/manage/message-templates/ |
| Webhook Config | App Dashboard → WhatsApp → Configuration |
| System Users (token gen) | https://business.facebook.com/settings/system-users |

---

## 🔐 Compliance Rules (WhatsApp Anti-Spam)

- ✅ **Opt-in only:** Message users who submitted a form on yoganteek.com
- ✅ **Opt-out:** Every outbound message ends with "Reply STOP to unsubscribe"
- ✅ **Template first:** Use approved templates for ALL first-contact messages
- ✅ **24h window:** Free-text replies only after user sends a message first
- ❌ **No bulk marketing:** Never blast contacts not from form submissions
- ❌ **No unofficial tools:** No Baileys/WAWebJS — risk of permanent ban

---

## 🧪 Test Commands

```bash
# Test 1: Lead form → WA to lead + owner
curl -X POST https://yoganteek-api.onrender.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Sujit Test","email":"test@test.com","phone":"91XXXXXXXXXX","health_goal":"Stress Relief"}'

# Test 2: Webhook verification
curl "https://yoganteek-api.onrender.com/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=yoganteek_wa_2026&hub.challenge=12345"
# Expected: 12345

# Test 3: Corporate inquiry → WA
curl -X POST https://yoganteek-api.onrender.com/api/corporate-inquiries \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Corp","contact_name":"Raj","email":"raj@corp.com","phone":"91XXXXXXXXXX"}'
```

---

## 📊 Implementation Status Tracker

> Update statuses as you go: 🔴 TODO → 🟡 In Progress → 🟢 Done

---

### 🏗️ Phase 1 — Meta Developer Account Setup (Steps 1–5)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Meta Developer Account created | 🟢 Done | Login at developers.facebook.com |
| 2 | Meta Developer Terms accepted | 🟢 Done | |
| 3 | Meta Business App created (`Yoganteek Wellness`) | 🟢 Done | Type: Business |
| 4 | WhatsApp product added to the app | 🟢 Done | From app dashboard → Add Products |
| 5 | Business number `+91 90085 80255` added | 🟢 Done | WhatsApp → API Setup → Step 2 Production Setup |
| 6 | OTP verified on `90085 80255` | 🟢 Done | Status shows "Registered" ✅ |
| 7 | **Phone Number ID** noted down | 🟢 Done | `1269162839607220` |
| 8 | **WhatsApp Business Account ID** noted down | 🟢 Done | `100971938524825` |

---

### 🔐 Phase 2 — Access Token (Step 5)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9 | System User created (`yoganteek-api-user`, Admin) | 🟢 Done | business.facebook.com/settings/system-users |
| 10 | Permanent Token generated with WA permissions | 🟢 Done | Permissions: messaging + management |
| 11 | **Permanent Access Token** saved securely | 🟢 Done | Saved in this file + Render env vars next |

---

### ⚙️ Phase 3 — Backend Code Changes

| # | Task | Status | Notes |
|---|------|--------|-------|
| 12 | `httpx` added to `requirements.txt` | 🔴 TODO | For Meta API HTTP calls |
| 13 | WhatsApp env vars added to `main.py` | 🔴 TODO | `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, etc. |
| 14 | `send_whatsapp()` function added | 🔴 TODO | Core text message sender |
| 15 | `send_whatsapp_template()` function added | 🔴 TODO | Template message sender |
| 16 | Lead endpoint `/api/leads` wired to WA | 🔴 TODO | WA to lead + owner on new lead |
| 17 | Corporate endpoint `/api/corporate-inquiries` wired to WA | 🔴 TODO | WA to corporate contact + owner |
| 18 | Contact endpoint `/api/contact-submissions` wired to WA | 🔴 TODO | WA to contact submitter + owner |
| 19 | `/webhook/whatsapp` GET endpoint added (verify) | 🔴 TODO | Challenge-response for Meta |
| 20 | `/webhook/whatsapp` POST endpoint added (receive) | 🔴 TODO | Auto-reply bot logic |
| 21 | `/webhook/calendly` endpoint added | 🔴 TODO | WA reminder on booking |
| 22 | `render.yaml` updated with WA env var keys | 🔴 TODO | So Render knows to expect them |

---

### 🌐 Phase 4 — Render Deployment (Step 6)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 23 | `WA_PHONE_NUMBER_ID` set in Render | 🔴 TODO | From Phase 1 Step 7 |
| 24 | `WA_ACCESS_TOKEN` set in Render | 🔴 TODO | From Phase 2 Step 11 |
| 25 | `WA_WEBHOOK_VERIFY_TOKEN` set in Render | 🔴 TODO | Value: `yoganteek_wa_2026` |
| 26 | `OWNER_WHATSAPP` set in Render | 🔴 TODO | Value: `919078419107` |
| 27 | Code deployed to Render (auto on git push) | 🔴 TODO | Push to main branch |

---

### 🔗 Phase 5 — Webhook & Templates (Steps 7–8)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 28 | Webhook URL registered in Meta Dashboard | 🔴 TODO | After Render deploy — Step 7 |
| 29 | Webhook subscription to `messages` field | 🔴 TODO | In App → WhatsApp → Configuration |
| 30 | Calendly webhook connected to Render URL | 🔴 TODO | Calendly → Integrations → Webhooks |
| 31 | `lead_welcome` template submitted to Meta | 🔴 TODO | ~24h approval wait |
| 32 | `corporate_welcome` template submitted to Meta | 🔴 TODO | ~24h approval wait |
| 33 | `appointment_reminder` template submitted to Meta | 🔴 TODO | ~24h approval wait |
| 34 | All templates approved by Meta | 🔴 TODO | Check Meta Templates Manager |

---

### ✅ Phase 6 — Testing & Go-Live

| # | Task | Status | Notes |
|---|------|--------|-------|
| 35 | Webhook verification curl test passed | 🔴 TODO | See 🧪 Test Commands section |
| 36 | Lead form → WA to lead confirmed | 🔴 TODO | Test with real number |
| 37 | Lead form → WA to owner confirmed | 🔴 TODO | Check Dr. Jayashree's WA |
| 38 | Corporate form → WA confirmed | 🔴 TODO | |
| 39 | Calendly booking → WA reminder confirmed | 🔴 TODO | |
| 40 | Auto-reply bot responding to keywords | 🔴 TODO | Test `hi`, `book`, `price` etc. |
| 41 | **End-to-end test fully passed** 🎉 | 🔴 TODO | System is live! |

---

## 📞 Key Contacts

| Person/Resource | Value |
|----------------|-------|
| **WhatsApp Business API Number** | **+91 90085 80255** (no WA app — ✅ ready for API) |
| Dr. Jayashree's WhatsApp (owner alerts) | +91 90784 19107 |
| Business Phone | +91 797 831 1312 |
| Business Email | yoganteekwellness@gmail.com |
| Calendly | https://calendly.com/jspyoga1986/30min |
| Website | https://yoganteek.com |

---

*This file is the single source of truth for WhatsApp automation in this project.*  
*Update the Status Tracker and Last Updated date with every change.*
