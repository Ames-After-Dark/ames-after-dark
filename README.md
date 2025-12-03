# Startup Instructions

## Frontend

- cd frontend
- npm i
-  Start Android Studio Android Emulator
    - In Android Studio press the three vertial dots next to "Get From VCS"
    -  Press "Virtual Device Manager"
    -  Run your virtual device (May need to be configured if you don't have one set up)
- npm run android

## Backend

- cd backend
- npm i
- node index.js

# Ames After Dark: Server Documentation

## Infrastructure Overview
* **Host:** AWS EC2 (Ubuntu 24.04)
* **Public IP:** 44.222.117.9
* **Domain:** amesafterdark.com (Managed via Squarespace DNS)
* **Reverse Proxy:** Caddy (Handles HTTPS/SSL automatically)
* **App Port:** Runs on localhost:3000 (Not exposed publicly)

---

## Key File Paths
| Component | Path | Purpose |
| :--- | :--- | :--- |
| **Project Root** | /home/ubuntu/app | Git repository root |
| **Backend Code** | /home/ubuntu/app/backend | Node.js/Express application |
| **Service Config** | /etc/app.env | Env variables for the running app (Systemd) |
| **Prisma Config** | /home/ubuntu/app/backend/.env | Env variables for CLI commands (Migrations) |
| **Web Server** | /etc/caddy/Caddyfile | Domain & Proxy settings |
| **Logs** | sudo journalctl -u myapp -f | Real-time application logs |

---

## Management Commands (Run on Server)

### 1. Deployment
Run this script whenever you update code on GitHub. It pulls code, installs dependencies, regenerates the Prisma client, and restarts the app.
./deploy.sh

### 2. Manual Service Control
sudo systemctl restart myapp   # Restart Node.js app
sudo systemctl stop myapp      # Stop app
sudo systemctl status myapp    # Check if running

### 3. Database Reset (Destructive)
Only use this if you want to wipe all data and start fresh from the schema.
./reset_db.sh

---

## Database Access (PostgreSQL)

* **Database Name:** ames_after_dark_db
* **User:** aad_admin
* **Schema:** app (Note: Tables are NOT in the public schema)

### How to Access Remotely (SSH Tunneling)
Do not open port 5432 to the public internet. Use tunnels instead.

**Option A: Prisma Studio (Visual Editor)**
1.  **On Laptop:** ssh -L 5555:localhost:5555 -i ~/.ssh/your-key.pem ubuntu@44.222.117.9
2.  **On Server:** cd ~/app/backend && npx prisma studio
3.  **Open Browser:** Go to http://localhost:5555

**Option B: TablePlus / DBeaver (SQL Client)**
1.  **Host:** localhost
2.  **Port:** 5432
3.  **SSH Tunnel:** Connect to 44.222.117.9 using ubuntu user and your key.

---

## Developer Workflow

1.  **Database Changes:**
    * Partners make schema changes locally (npx prisma migrate dev).
    * Push migration files to GitHub.
    * Deploy on server (./deploy.sh automatically runs migrate deploy).

2.  **Environment Variables:**
    * If you add a new API key, you must add it to TWO places on the server:
        1.  /etc/app.env (For the running app)
        2.  /home/ubuntu/app/backend/.env (For Prisma commands)
