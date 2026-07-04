# Yoganteek Deployment Guide

## Project Structure
```
yoganteek/
├── frontend/          → Deploys to cPanel (Cloudhasty)
│   ├── index.html
│   ├── landing-page-prototype.html
│   ├── about.html
│   ├── services.html
│   ├── contact.html
│   └── Yoganteek_Corporate_Landing_Page.html
├── backend/           → Deploys to Render (Free)
│   ├── main.py
│   ├── requirements.txt
│   └── render.yaml
└── .github/workflows/
    └── deploy-frontend.yml  → Auto-deploys frontend to cPanel
```

---

## Step 1: Deploy Backend to Render (Free)

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account (free)

### 1.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the `yoganteek` repo

### 1.3 Configure Service
- **Name:** `yoganteek-api`
- **Runtime:** Python
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Plan:** Free

### 1.4 Set Environment Variable
1. Go to **Environment** tab
2. Add:
   ```
   Key: DATABASE_URL
   Value: postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/Yoganteek?sslmode=require
   ```

### 1.5 Deploy
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Your API URL will be: `https://yoganteek-api.onrender.com`

### 1.6 Verify
- Visit `https://yoganteek-api.onrender.com/`
- Should show: `{"status":"Yoganteek API is running"}`

---

## Step 2: Deploy Frontend to cPanel

### 2.1 Get cPanel FTP Credentials
1. Log into your Cloudhasty cPanel
2. Go to **FTP Accounts** or **File Manager**
3. Note down:
   - **Host/Server:** Your domain or server IP
   - **Username:** Your cPanel username
   - **Password:** Your cPanel password
   - **Directory:** `/public_html/`

### 2.2 Add to GitHub Secrets
1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these 3 secrets:
   ```
   Name: CPANEL_HOST
   Value: <your-cpanel-host> (e.g., ftp.yourdomain.com)

   Name: CPANEL_USERNAME
   Value: <your-cpanel-username>

   Name: CPANEL_PASSWORD
   Value: <your-cpanel-password>
   ```

---

## Step 3: Push to GitHub

```bash
cd D:\SUJIT\PROJETCS\yoganteek
git add .
git commit -m "Deploy: frontend to cPanel, backend to Render"
git push origin main
```

GitHub Actions will automatically deploy the frontend to cPanel.

---

## Step 4: Verify

### Backend (Render)
- Visit `https://yoganteek-api.onrender.com/`
- Should show: `{"status":"Yoganteek API is running"}`

### Frontend (cPanel)
- Visit your domain
- Fill and submit the form
- Check data: `https://yoganteek-api.onrender.com/api/leads`

### Database (Neon)
- Go to https://console.neon.tech
- Select Yoganteek DB
- Run: `SELECT * FROM leads;`

---

## Environment Variables Summary

| Variable | Where | Value |
|----------|-------|-------|
| `DATABASE_URL` | Render Dashboard | Your Neon DB connection string |
| `CPANEL_HOST` | GitHub Secrets | Your cPanel FTP host |
| `CPANEL_USERNAME` | GitHub Secrets | Your cPanel username |
| `CPANEL_PASSWORD` | GitHub Secrets | Your cPanel password |

---

## Manual Deployment (if needed)

### Frontend to cPanel
1. Log into cPanel File Manager
2. Upload all files from `frontend/` folder to `/public_html/`

### Backend to Render
1. Render auto-deploys when you push to GitHub
2. Or manually trigger deploy from Render dashboard
