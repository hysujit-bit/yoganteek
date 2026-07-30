# 🏗️ Yoganteek WhatsApp Automation — Data Flow Architecture

---

## 1. Master System Overview

```mermaid
graph TB
    subgraph FRONTEND["🌐 Frontend — yoganteek.com"]
        F1[Lead Inquiry Form]
        F2[Corporate Inquiry Form]
        F3[Contact Form]
    end

    subgraph BACKEND["⚙️ Backend — FastAPI on Render"]
        B1[POST /api/leads]
        B2[POST /api/corporate-inquiries]
        B3[POST /api/contact-submissions]
        B4[GET /webhook/whatsapp]
        B5[POST /webhook/whatsapp]
        B6[POST /webhook/calendly]
    end

    subgraph STORAGE["🗄️ Storage — Neon PostgreSQL"]
        DB1[(leads)]
        DB2[(corporate_inquiries)]
        DB3[(contact_submissions)]
    end

    subgraph NOTIFICATIONS["📤 Notification Channels"]
        E1[📧 Gmail SMTP]
        WA[📱 Meta Cloud API]
    end

    subgraph EXTERNAL["🔗 External Services"]
        META[Meta / WhatsApp]
        CAL[Calendly]
    end

    subgraph RECIPIENTS["👤 Recipients"]
        LEAD[Lead's Phone]
        OWNER[Dr. Jayashree +91 90784 19107]
    end

    F1 --> B1
    F2 --> B2
    F3 --> B3

    B1 --> DB1
    B2 --> DB2
    B3 --> DB3

    B1 --> E1
    B1 --> WA
    B2 --> E1
    B2 --> WA
    B3 --> E1
    B3 --> WA

    WA --> META
    META --> LEAD
    META --> OWNER

    META -->|Incoming reply| B5
    CAL -->|Booking event| B6
    B6 --> WA

    B4 <-->|Verify token| META
```

---

## 2. Lead Form Submission Flow (Most Important)

```mermaid
sequenceDiagram
    actor User as 👤 Lead (Website Visitor)
    participant Form as 🌐 yoganteek.com Form
    participant API as ⚙️ FastAPI /api/leads
    participant DB as 🗄️ Neon PostgreSQL
    participant Email as 📧 Gmail SMTP
    participant MetaAPI as 📡 Meta Cloud API
    participant LeadWA as 📱 Lead's WhatsApp
    participant OwnerWA as 📱 Dr. Jayashree's WA

    User->>Form: Fills name, phone, email, health goal
    Form->>API: POST /api/leads (JSON payload)

    activate API
    API->>DB: INSERT INTO leads (...)
    DB-->>API: lead_id returned ✅

    par Email + WhatsApp sent simultaneously
        API->>Email: send_email(lead@email.com, "Thank you...")
        Email-->>LeadWA: 📧 Acknowledgement email delivered

        API->>MetaAPI: POST /messages { to: lead_phone, template: lead_welcome }
        MetaAPI-->>LeadWA: 📱 "Namaste [Name]! We received your inquiry..."

        API->>MetaAPI: POST /messages { to: 919078419107, text: alert }
        MetaAPI-->>OwnerWA: 📱 "🔔 New Lead: [Name], [Phone], [Concern]"
    end

    API-->>Form: { success: true, lead_id: 42 }
    deactivate API
    Form-->>User: ✅ "Thank you! We'll get back to you soon."
```

---

## 3. Incoming Message Auto-Reply Bot Flow

```mermaid
flowchart TD
    A[📱 User sends WhatsApp message\nto Dr. Jayashree's business number] --> B

    B[Meta Cloud API receives message] --> C

    C[POST /webhook/whatsapp\nFastAPI receives JSON payload] --> D

    D{Parse message text\nto lowercase}

    D --> E{Contains keyword?}

    E -->|hi / hello / namaste| F[🙏 Send Welcome Menu\n1. Book session\n2. Pricing\n3. Corporate\n4. Contact]

    E -->|book / appointment / session| G[📅 Send Calendly Link\nhttps://calendly.com/jspyoga1986/30min]

    E -->|price / cost / fee / rate| H[💰 Send Pricing Info\nServices from ₹1,000\nLink to services page]

    E -->|corporate / company / b2b| I[🏢 Send Corporate Info\nLink to corporate page\n+91 797 831 1312]

    E -->|stop / unsubscribe| J[❌ Opt-out Confirmed\nYou've been unsubscribed\nfrom WhatsApp updates]

    E -->|No match| K[💬 Fallback Reply\nOur team will respond shortly\nCall: +91 797 831 1312]

    F & G & H & I & J & K --> L

    L[Meta Cloud API sends reply\nback to user's WhatsApp] --> M[✅ User receives response\nwithin seconds]
```

---

## 4. Calendly Booking Reminder Flow

```mermaid
sequenceDiagram
    actor User as 👤 Client
    participant Cal as 📅 Calendly
    participant API as ⚙️ FastAPI /webhook/calendly
    participant MetaAPI as 📡 Meta Cloud API
    participant UserWA as 📱 Client's WhatsApp

    User->>Cal: Books session on Calendly

    Cal->>API: POST /webhook/calendly\n{ event: "invitee.created", payload: {...} }

    activate API
    Note over API: Extract: name, phone, start_time
    API->>API: Format date: "18 Jul 2026 at 10:00 AM IST"

    API->>MetaAPI: POST /messages\n{ template: appointment_reminder,\n  params: [name, formatted_time] }
    MetaAPI-->>UserWA: 📱 "⏰ Hi [Name], your session\nis confirmed for [Date/Time]"
    deactivate API

    Note over User,UserWA: 24 hours before session...

    Cal->>API: POST /webhook/calendly\n{ event: "invitee.canceled" }
    API->>MetaAPI: Send cancellation notice
    MetaAPI-->>UserWA: 📱 "❌ Session canceled.\nReschedule: calendly.com/..."
```

---

## 5. Meta Webhook Verification (One-Time Setup)

```mermaid
sequenceDiagram
    participant Meta as 📡 Meta Platform
    participant API as ⚙️ FastAPI GET /webhook/whatsapp

    Note over Meta,API: This happens ONCE when you register the webhook URL in Meta Dashboard

    Meta->>API: GET /webhook/whatsapp\n?hub.mode=subscribe\n&hub.verify_token=yoganteek_wa_2026\n&hub.challenge=RANDOM_NUMBER

    activate API
    API->>API: Check: verify_token == env var?
    alt Token matches ✅
        API-->>Meta: Return hub.challenge (RANDOM_NUMBER)
        Note over Meta: Webhook verified! ✅\nMeta will now send events here.
    else Token mismatch ❌
        API-->>Meta: 403 Forbidden
        Note over Meta: Webhook rejected ❌
    end
    deactivate API
```

---

## 6. Tech Stack Layer Map

```mermaid
graph LR
    subgraph LAYER1["Layer 1 — User Interface"]
        L1A["yoganteek.com\n(HTML/CSS/JS)"]
    end

    subgraph LAYER2["Layer 2 — API Layer (Render)"]
        L2A["FastAPI\nmain.py"]
        L2B["httpx\nasync HTTP client"]
        L2C["smtplib\nemail sender"]
    end

    subgraph LAYER3["Layer 3 — Data Store (Neon)"]
        L3A[("leads table")]
        L3B[("corporate_inquiries")]
        L3C[("contact_submissions")]
    end

    subgraph LAYER4["Layer 4 — External APIs"]
        L4A["Meta Cloud API\ngraph.facebook.com/v18.0"]
        L4B["Gmail SMTP\nsmtp.gmail.com:587"]
        L4C["Calendly Webhooks"]
    end

    subgraph LAYER5["Layer 5 — End Delivery"]
        L5A["📱 WhatsApp\n(Lead's phone)"]
        L5B["📱 WhatsApp\n(Dr. Jayashree)"]
        L5C["📧 Email\n(Lead's inbox)"]
    end

    L1A -->|HTTP POST| L2A
    L2A -->|psycopg2| L3A & L3B & L3C
    L2A -->|httpx async| L2B --> L4A
    L2A -->|smtplib| L2C --> L4B
    L4C -->|webhook POST| L2A
    L4A -->|delivery| L5A & L5B
    L4B -->|delivery| L5C
```

---

## 7. Data Payload Map

What data flows at each trigger point:

### 7.1 — Lead Form → Backend
```json
{
  "name": "Ramesh Kumar",
  "email": "ramesh@gmail.com",
  "phone": "9876543210",
  "health_goal": "Stress Relief",
  "concern": "Back Pain",
  "message": "I want to join online classes",
  "calendly_url": null
}
```

### 7.2 — Backend → Meta API (Lead Welcome Template)
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
      "parameters": [{ "type": "text", "text": "Ramesh Kumar" }]
    }]
  }
}
```

### 7.3 — Meta Webhook → Backend (Incoming Message)
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210",
          "text": { "body": "Hi, I want to book a session" },
          "type": "text"
        }]
      }
    }]
  }]
}
```

### 7.4 — Calendly → Backend (Booking Created)
```json
{
  "event": "invitee.created",
  "payload": {
    "invitee": {
      "name": "Ramesh Kumar",
      "text_reminder_number": "+919876543210"
    },
    "event": {
      "start_time": "2026-07-19T04:30:00Z"
    }
  }
}
```

---

## 8. Summary — What Triggers What

| Trigger | DB Write | Email | WA → Lead | WA → Owner |
|---------|----------|-------|-----------|------------|
| Lead form submitted | ✅ leads | ✅ | ✅ Welcome msg | ✅ Alert |
| Corporate form submitted | ✅ corporate_inquiries | ✅ | ✅ Welcome msg | ✅ Alert |
| Contact form submitted | ✅ contact_submissions | ✅ | ✅ Acknowledgement | ✅ Alert |
| User replies on WA | ❌ | ❌ | ✅ Auto-reply | ❌ |
| Calendly booking | ❌ | ❌ (Calendly does it) | ✅ Confirmation | ❌ |
| Calendly cancellation | ❌ | ❌ | ✅ Cancel notice | ❌ |
