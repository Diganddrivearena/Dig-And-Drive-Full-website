# Dig & Drive — Step-by-Step Deployment Guide

Follow these steps **in order**. Each phase must finish before the next one.

| Item | Value |
|---|---|
| Domain | `diganddrive.in` |
| VPS IP | `103.127.146.58` |
| SSH port | `7576` |
| Deploy folder | `/var/www/dig-and-drive` |
| Live site | [https://diganddrive.in](https://diganddrive.in) |
| Admin panel | [https://diganddrive.in/admin/login](https://diganddrive.in/admin/login) |
| GitHub | [Dig-And-Drive-Full-website](https://github.com/Diganddrivearena/Dig-And-Drive-Full-website) |

---

## Before you start — collect these

Create accounts and gather values **before** touching the VPS.

| # | What you need | Where to get it |
|---|---|---|
| 1 | VPS login (IP, SSH port, password or SSH key) | Your hosting panel |
| 2 | `DATABASE_URL` | [Neon console](https://console.neon.tech) → Connection string (pooled) |
| 3 | `BETTER_AUTH_SECRET` | Run: `openssl rand -base64 32` |
| 4 | Google OAuth Client ID + Secret | [Google Cloud Console](https://console.cloud.google.com) |
| 5 | Razorpay Key ID + Secret | [Razorpay dashboard](https://dashboard.razorpay.com) |
| 6 | Fast2SMS API key | [fast2sms.com](https://www.fast2sms.com) → Dev API |
| 7 | Domain DNS access | [Hostinger hPanel](https://hpanel.hostinger.com) |

> Never commit `.env` to Git. Never paste passwords in chat.

---

# PHASE 1 — Database (Neon)

Do this on your **computer** first.

### Step 1.1 — Create Neon project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Click **New Project**
3. Name it `dig-and-drive`
4. Choose a region close to your users

### Step 1.2 — Copy connection string

1. Open your project → **Dashboard**
2. Click **Connect**
3. Copy the **pooled** connection string
4. Save it — you will paste it as `DATABASE_URL` later

Example shape (yours will differ):

```text
postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

### Step 1.3 — Test database locally (optional but recommended)

```bash
git clone https://github.com/Diganddrivearena/Dig-And-Drive-Full-website.git
cd Dig-And-Drive-Full-website

cp server/.env.example server/.env
nano server/.env   # paste DATABASE_URL
```

Add a temporary secret:

```env
BETTER_AUTH_SECRET=paste-output-of-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:5173
API_PORT=8787
```

Then:

```bash
cd server
npm install
npm run db:push
npm run db:seed
```

**Success:** No errors; tables created; products seeded.

---

# PHASE 2 — Prepare the VPS

SSH into the server:

```bash
ssh -p 7576 root@103.127.146.58
```

### Step 2.1 — Update Ubuntu

```bash
apt update && apt upgrade -y
```

### Step 2.2 — Install required software

```bash
apt install -y curl wget git nano htop ufw nginx
```

### Step 2.3 — Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v    # must show v20.x
npm -v
```

### Step 2.4 — Install PM2

```bash
npm install -g pm2
pm2 -v
```

### Step 2.5 — Open firewall ports

```bash
ufw allow 7576/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

### Step 2.6 — Create app folder

```bash
mkdir -p /var/www/dig-and-drive
cd /var/www/dig-and-drive
```

**Success:** Node 20, PM2, Nginx, and UFW are installed.

---

# PHASE 3 — Deploy the application

Still on the VPS.

### Step 3.1 — Clone the repo

```bash
cd /var/www/dig-and-drive
git clone https://github.com/Diganddrivearena/Dig-And-Drive-Full-website.git .
```

### Step 3.2 — Create production `.env`

```bash
nano /var/www/dig-and-drive/server/.env
```

Paste and fill **every** line:

```env
# Database
DATABASE_URL=postgresql://YOUR_NEON_CONNECTION_STRING

# Auth
BETTER_AUTH_SECRET=YOUR_OPENSSL_RANDOM_STRING
BETTER_AUTH_URL=https://diganddrive.in

# Google login (Phase 6 — can leave blank until then)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Admin — email that gets admin role
ADMIN_EMAILS=admin@diganddrive.com

# Razorpay (Phase 7)
RAZORPAY_KEY_ID=rzp_test_XXXXX
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET

# Server
API_PORT=8787

# Frontend build vars (read by Vite during npm run build)
VITE_API_URL=/api
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXX
VITE_BETTER_AUTH_URL=https://diganddrive.in

# Fast2SMS (Phase 8)
FAST2SMS_API_KEY=YOUR_FAST2SMS_KEY
FAST2SMS_WHATSAPP_PHONE_NUMBER_ID=
FAST2SMS_ORDER_MESSAGE_ID=
FAST2SMS_ADMIN_NUMBER=9703455666
FAST2SMS_SEND_SMS=
```

Save: `Ctrl+O`, Enter, `Ctrl+X`

### Step 3.3 — Install npm packages

```bash
cd /var/www/dig-and-drive/server && npm install
cd /var/www/dig-and-drive/frontend && npm install
```

### Step 3.4 — Push schema and seed data

```bash
cd /var/www/dig-and-drive/server
npm run db:push
npm run db:seed
```

### Step 3.5 — Build the frontend

```bash
cd /var/www/dig-and-drive/frontend
npm run build
```

**Success:** Folder `frontend/dist/` exists with `index.html` inside.

### Step 3.6 — Start the API with PM2

```bash
cd /var/www/dig-and-drive/server
pm2 start "npx tsx --env-file=.env src/index.ts" --name dig-and-drive-api
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints (starts with `sudo env...`).

### Step 3.7 — Verify API is running

```bash
pm2 list
curl http://127.0.0.1:8787/api/health
```

**Expected output:** `{"ok":true}`

---

# PHASE 4 — Configure Nginx

### Step 4.1 — Create Nginx site file

```bash
nano /etc/nginx/sites-available/diganddrive.in
```

Paste:

```nginx
upstream dig_api {
    server 127.0.0.1:8787;
}

server {
    listen 80;
    listen [::]:80;
    server_name diganddrive.in www.diganddrive.in 103.127.146.58;

    root /var/www/dig-and-drive/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://dig_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 4.2 — Enable the site

```bash
ln -sf /etc/nginx/sites-available/diganddrive.in /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### Step 4.3 — Test over HTTP (IP only)

From your computer:

```bash
curl http://103.127.146.58/api/health
```

**Expected:** `{"ok":true}`

**Success:** Site loads on IP; API responds.

---

# PHASE 5 — Point DNS to VPS

Do this in **Hostinger**, not on the VPS.

### Step 5.1 — Open DNS panel

1. Go to [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. **Domains** → **diganddrive.in**
3. Open **DNS records** tab

### Step 5.2 — Fix nameservers (if needed)

If you see parking nameservers (`horizon.dns-parking.com`):

1. Go to **Nameservers** tab
2. Select **Use Hostinger nameservers**
3. Save and wait 15–30 minutes

### Step 5.3 — Update website records

**Do NOT click "Reset DNS records"** — that breaks Zoho email.

| Action | Type | Name | Value |
|---|---|---|---|
| Edit | A | `@` | `103.127.146.58` |
| Delete | CNAME | `www` | (any Vercel CNAME) |
| Add | A | `www` | `103.127.146.58` |

**Keep unchanged:** MX, SPF, DKIM, DMARC records (Zoho mail).

### Step 5.4 — Wait and verify

Wait 5–30 minutes, then run:

```bash
dig diganddrive.in +short
dig www.diganddrive.in +short
```

Both must show: `103.127.146.58`

**Success:** Domain resolves to your VPS.

---

# PHASE 6 — Enable SSL (HTTPS)

Run on the **VPS** only after DNS is correct.

### Step 6.1 — Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Step 6.2 — Get certificate

```bash
certbot --nginx \
  -d diganddrive.in \
  -d www.diganddrive.in \
  --non-interactive \
  --agree-tos \
  -m admin@diganddrive.com \
  --redirect
```

### Step 6.3 — Verify HTTPS

```bash
curl https://diganddrive.in/api/health
```

Open in browser: [https://diganddrive.in](https://diganddrive.in)

**Success:** Padlock in browser; HTTP redirects to HTTPS.

---

# PHASE 7 — Create admin login

### Step 7.1 — Confirm admin email in `.env`

On VPS:

```bash
grep ADMIN_EMAILS /var/www/dig-and-drive/server/.env
```

Must show:

```env
ADMIN_EMAILS=admin@diganddrive.com
```

If you change it:

```bash
pm2 restart dig-and-drive-api
```

### Step 7.2 — Create admin account

**Option A — Browser (easiest)**

1. Open [https://diganddrive.in/admin/login](https://diganddrive.in/admin/login)
2. Sign up with email `admin@diganddrive.com`
3. Password: at least 8 characters (use a strong one)

**Option B — Command line**

```bash
curl -X POST 'https://diganddrive.in/api/auth/sign-up/email' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@diganddrive.com","password":"YOUR_PASSWORD","name":"Admin"}'
```

### Step 7.3 — Log in

1. Go to [https://diganddrive.in/admin/login](https://diganddrive.in/admin/login)
2. Email: `admin@diganddrive.com`
3. Password: what you set in Step 7.2

**Success:** You see the admin dashboard.

> Only emails listed in `ADMIN_EMAILS` become admin. Add more with commas: `admin@a.com,owner@b.com`

---

# PHASE 8 — Connect Google login

### Step 8.1 — Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID** → **Web application**

### Step 8.2 — Authorized JavaScript origins

Add exactly:

```text
https://diganddrive.in
https://www.diganddrive.in
```

(Local dev only: `http://localhost:5173`)

### Step 8.3 — Authorized redirect URIs

Add exactly:

```text
https://diganddrive.in/api/auth/callback/google
```

(Local dev only: `http://localhost:5173/api/auth/callback/google`)

> Spelling matters: **diganddrive.in** (two d's in "drive") — not `digandrive.in`

### Step 8.4 — Add to server `.env`

```bash
nano /var/www/dig-and-drive/server/.env
```

```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
```

```bash
pm2 restart dig-and-drive-api
```

### Step 8.5 — Test

1. Open [https://diganddrive.in/login](https://diganddrive.in/login)
2. Click **Continue with Google**
3. Complete Google sign-in

**Success:** Redirected back, logged in.

---

# PHASE 9 — Connect Razorpay payments

### Step 9.1 — Get Razorpay keys

1. [dashboard.razorpay.com](https://dashboard.razorpay.com) → **Settings** → **API Keys**
2. Generate **Test** keys first; switch to **Live** when ready for real money

### Step 9.2 — Update `.env`

```bash
nano /var/www/dig-and-drive/server/.env
```

```env
RAZORPAY_KEY_ID=rzp_test_XXXXX
RAZORPAY_KEY_SECRET=YOUR_SECRET
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXX
```

`VITE_RAZORPAY_KEY_ID` must match `RAZORPAY_KEY_ID`.

### Step 9.3 — Rebuild frontend and restart API

```bash
cd /var/www/dig-and-drive/frontend && npm run build
pm2 restart dig-and-drive-api
```

### Step 9.4 — Test checkout

1. Add a product to cart on [https://diganddrive.in](https://diganddrive.in)
2. Enter name, email, 10-digit mobile
3. Pay with Razorpay test card

**Success:** Payment completes; order appears in admin.

---

# PHASE 10 — Connect Fast2SMS (notifications)

### Step 10.1 — Admin SMS (works immediately)

Already in `.env`:

```env
FAST2SMS_API_KEY=your-key
FAST2SMS_ADMIN_NUMBER=9703455666
```

After each paid order, **9703455666** gets an SMS alert.

Restart if you just added the key:

```bash
pm2 restart dig-and-drive-api
```

### Step 10.2 — Customer WhatsApp (requires onboarding)

1. [fast2sms.com](https://www.fast2sms.com) → **Dev API** → **WhatsApp Manager**
2. **Connect WhatsApp Business** (Facebook/Meta)
3. **Create template:**
   - Category: **UTILITY**
   - Name: `order_confirmation`
   - Body:

```text
Hi {{1}}, your DIG & DRIVE order #{{2}} is confirmed.
Items: {{3}}
Total paid: Rs {{4}}. We'll start packing shortly.
```

4. Submit and wait for **Approved** (24–48 hours)

### Step 10.3 — Get template IDs

After approval, on VPS:

```bash
cd /var/www/dig-and-drive/server
npm run fast2sms:status
```

Copy the printed values into `.env`:

```env
FAST2SMS_WHATSAPP_PHONE_NUMBER_ID=576xxxxxx
FAST2SMS_ORDER_MESSAGE_ID=8340
```

```bash
pm2 restart dig-and-drive-api
```

### Step 10.4 — Test WhatsApp order message

1. Place a test order with a **real WhatsApp number**
2. Check logs:

```bash
pm2 logs dig-and-drive-api --lines 30
```

**Success:** Customer receives WhatsApp with order details.

---

# PHASE 11 — How to update the site later

Every time you change code:

```bash
ssh -p 7576 root@103.127.146.58

cd /var/www/dig-and-drive
git pull origin main

cd server
npm install                  # only if package.json changed
npm run db:push              # only if database schema changed

cd ../frontend
npm install                  # only if package.json changed
npm run build                # always after frontend changes

pm2 restart dig-and-drive-api
```

If you only changed `.env`:

```bash
nano /var/www/dig-and-drive/server/.env
pm2 restart dig-and-drive-api
```

If you changed `VITE_*` variables, also run `npm run build` in `frontend/`.

---

# Quick verification checklist

Run after full deployment:

| # | Check | Command or URL | Expected |
|---|---|---|---|
| 1 | API health | `curl https://diganddrive.in/api/health` | `{"ok":true}` |
| 2 | Homepage | [https://diganddrive.in](https://diganddrive.in) | Site loads |
| 3 | Products API | [https://diganddrive.in/api/products](https://diganddrive.in/api/products) | JSON list |
| 4 | Admin login | [https://diganddrive.in/admin/login](https://diganddrive.in/admin/login) | Dashboard works |
| 5 | PM2 running | `pm2 list` | `dig-and-drive-api` online |
| 6 | SSL valid | Browser padlock | HTTPS, no warnings |
| 7 | DNS | `dig diganddrive.in +short` | `103.127.146.58` |

---

# Common problems

### Site still shows Vercel / old page

- Fix DNS A records (Phase 5)
- Wait for propagation; test in incognito

### `502 Bad Gateway` on `/api`

```bash
pm2 list
pm2 logs dig-and-drive-api
curl http://127.0.0.1:8787/api/health
```

Usually: API crashed — check `DATABASE_URL` in `.env`, then `pm2 restart dig-and-drive-api`

### SSL / Certbot failed

- DNS must point to VPS first (Phase 5)
- Port 80 open: `ufw allow 80/tcp`
- Retry Phase 6

### Google login — redirect error

- Redirect URI must be exactly: `https://diganddrive.in/api/auth/callback/google`
- Check spelling: **diganddrive.in**
- `BETTER_AUTH_URL=https://diganddrive.in` in `.env`

### Admin login works but not admin role

- Email must match `ADMIN_EMAILS` exactly
- `pm2 restart dig-and-drive-api` after changing `.env`

### WhatsApp not sent after payment

```bash
cd /var/www/dig-and-drive/server && npm run fast2sms:status
```

- Template must be **Approved**
- All three required: `FAST2SMS_API_KEY`, `FAST2SMS_ORDER_MESSAGE_ID`, `FAST2SMS_WHATSAPP_PHONE_NUMBER_ID`
- Customer phone must be valid 10-digit Indian mobile

---

# Daily commands (cheat sheet)

```bash
# Connect to server
ssh -p 7576 root@103.127.146.58

# View API logs
pm2 logs dig-and-drive-api

# Restart API
pm2 restart dig-and-drive-api

# Check health
curl https://diganddrive.in/api/health

# Full update
cd /var/www/dig-and-drive && git pull && cd frontend && npm run build && pm2 restart dig-and-drive-api

# Fast2SMS status
cd /var/www/dig-and-drive/server && npm run fast2sms:status
```

---

# Local development (on your computer)

```bash
git clone https://github.com/Diganddrivearena/Dig-And-Drive-Full-website.git
cd Dig-And-Drive-Full-website

cp server/.env.example server/.env
# Edit server/.env — use Neon DATABASE_URL and BETTER_AUTH_URL=http://localhost:5173

cd server && npm install && npm run db:push && npm run db:seed
cd ../frontend && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Create `frontend/.env` for local:

```env
VITE_API_URL=/api
VITE_BETTER_AUTH_URL=http://localhost:5173
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXX
```

---

# Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Random string (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | `https://diganddrive.in` (prod) or `http://localhost:5173` (dev) |
| `GOOGLE_CLIENT_ID` | For Google login | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google login | OAuth secret |
| `ADMIN_EMAILS` | Yes | Comma-separated admin emails |
| `RAZORPAY_KEY_ID` | For checkout | Server-side Razorpay key |
| `RAZORPAY_KEY_SECRET` | For checkout | Server-side Razorpay secret |
| `API_PORT` | Yes | `8787` |
| `VITE_API_URL` | Build | `/api` |
| `VITE_RAZORPAY_KEY_ID` | Build | Public Razorpay key (same as key ID) |
| `VITE_BETTER_AUTH_URL` | Build | Same as `BETTER_AUTH_URL` |
| `FAST2SMS_API_KEY` | Notifications | Fast2SMS Dev API key |
| `FAST2SMS_ADMIN_NUMBER` | Admin SMS | 10-digit mobile (e.g. `9703455666`) |
| `FAST2SMS_WHATSAPP_PHONE_NUMBER_ID` | WhatsApp | From WhatsApp Manager |
| `FAST2SMS_ORDER_MESSAGE_ID` | WhatsApp | Approved template ID |
| `FAST2SMS_SEND_SMS` | Optional | `true` = SMS customer (not WhatsApp) |

Full template: `server/.env.example`

---

*Dig & Drive Arena — Last updated September 2026*
