-- Yoganteek Consultation Leads Table
-- Run this script to create the leads table in Neon DB

CREATE TABLE IF NOT EXISTS leads (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    health_goal     VARCHAR(100),
    concern         VARCHAR(100),
    message         TEXT,
    calendly_url    TEXT,
    source          VARCHAR(100) DEFAULT 'landing-page',
    payment_status  VARCHAR(20) DEFAULT 'not_required',
    transaction_id  VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
