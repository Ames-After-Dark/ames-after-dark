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
* **Domain:** amesafterdark.com (Managed via Cloudflare DNS)
* **Reverse Proxy:** Caddy (Handles HTTPS/SSL automatically)
* **App Port:** Runs on localhost:3000 (Not exposed publicly)

---

## Database Access (PostgreSQL)

**Option A: Prisma Studio (Visual Editor)**
1.  **On Laptop:** ssh -L 5555:localhost:5555 -i ~/.ssh/your-key.pem ubuntu@44.222.117.9
2.  **On Server:** cd ~/app/backend && npx prisma studio
3.  **Open Browser:** Go to http://localhost:5555

**Option B: TablePlus / DBeaver (SQL Client)**
1.  **Host:** localhost
2.  **Port:** 5432
3.  **SSH Tunnel:** Connect to 44.222.117.9 using ubuntu user and your key.

