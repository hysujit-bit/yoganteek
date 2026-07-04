from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import os

app = FastAPI(title="Yoganteek API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use environment variable for DB URL (set in Railway)
DB_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/Yoganteek?sslmode=require'
)


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: str
    health_goal: Optional[str] = None
    concern: Optional[str] = None
    message: Optional[str] = None
    calendly_url: Optional[str] = None


def get_db():
    return psycopg2.connect(DB_URL)


@app.post("/api/leads")
def create_lead(lead: LeadCreate):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO leads (name, email, phone, health_goal, concern, message, calendly_url)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (lead.name, lead.email, lead.phone, lead.health_goal, lead.concern, lead.message, lead.calendly_url)
        )
        lead_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "lead_id": lead_id, "message": "Lead saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/leads")
def get_leads():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, phone, health_goal, concern, created_at FROM leads ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        leads = []
        for row in rows:
            leads.append({
                "id": row[0], "name": row[1], "email": row[2],
                "phone": row[3], "health_goal": row[4],
                "concern": row[5], "created_at": str(row[6])
            })
        return {"leads": leads, "count": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def root():
    return {"status": "Yoganteek API is running"}
