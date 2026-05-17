# Suryam CRM

Solar project management CRM for managing applicants, documents, vendors, and DISCOM workflows.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | NestJS (Node.js) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| PDF Generation | PDFKit |
| Deployment | Railway (Docker) |

---

## Prerequisites

- **Node.js** v20+
- **PostgreSQL** running locally
- **npm** v9+

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/toptraders684-code/solarcrm.git
cd solarcrm
```

### 2. Backend — environment variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:<your_password>@localhost:5432/suryam_crm"

JWT_SECRET="suryam-crm-super-secret-jwt-key-change-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

ENCRYPTION_KEY="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
ENCRYPTION_IV="a1b2c3d4e5f6a7b8"

STORAGE_DRIVER="local"
UPLOAD_PATH="./uploads"

PORT=3000
NODE_ENV="development"
RATE_LIMIT_MAX=200
```

> Change `<your_password>` to your local PostgreSQL password.

### 3. Create the database

```sql
CREATE DATABASE suryam_crm;
```

Or via psql:

```bash
psql -U postgres -c "CREATE DATABASE suryam_crm;"
```

### 4. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Run database migrations and seed

```bash
cd backend
npx prisma migrate deploy
node prisma/seed.js
```

This creates all tables and seeds:
- Super admin: `superadmin@suryam.com` / `superadmin@123`
- Document master items for all 4 DISCOMs
- Checklist master items
- Demo admin and sample applicant

### 6. Create upload directories

```bash
mkdir -p backend/uploads/applicants backend/uploads/master backend/uploads/generated
```

---

## Running Locally

Open **two terminals**:

**Terminal 1 — Backend** (port 3000):

```bash
cd backend
npm run start:dev
```

**Terminal 2 — Frontend** (port 5173):

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The frontend dev server proxies all `/api` requests to `http://localhost:3000` automatically.

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@suryam.com` | `superadmin@123` |
| Demo Admin | `admin@suryam.com` | `admin@123` |

> Super Admin can create companies and admins. Admin manages their own company's staff, vendors, and applicants.

---

## Production Build (optional — for testing the Docker output locally)

Build the frontend into `backend/public/` so NestJS serves it as static files:

```bash
cd frontend
npm run build

cd ../backend
npm run build
npm run start
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
solarcrm/
├── backend/
│   ├── src/
│   │   ├── applicants/        # Applicant/project management
│   │   ├── auth/              # JWT auth, login, refresh
│   │   ├── document-master/   # Document type configuration per DISCOM
│   │   ├── documents/         # PDF generation (PDFKit)
│   │   ├── leads/             # Lead management
│   │   ├── reports/           # 8 report types + CSV export
│   │   ├── users/             # Staff and vendor user management
│   │   └── vendors/           # Vendor management + hierarchy
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   └── uploads/
│       ├── applicants/        # User-uploaded documents
│       ├── master/            # Admin-uploaded static files (view-type docs)
│       └── generated/         # Reserved for cached generated PDFs
├── frontend/
│   └── src/
│       ├── pages/
│       ├── services/
│       ├── components/
│       └── types/
├── Dockerfile                 # Multi-stage: builds frontend → backend → production image
└── railway.toml
```

---

## Adding a New Generated Document

Generated documents are PDFs built on-demand from applicant data using PDFKit.

1. In the Railway/admin UI: add a `document_master` row with `docType = 'generate'` and the exact title you'll use in code.
2. In `backend/src/documents/document-generator.service.ts`, add a case to the `switch`:

```ts
case 'Your Document Title':
  buffer = await this.yourDocument(applicant);
  break;
```

3. Write the private method `yourDocument(applicant: any): Promise<Buffer>` using PDFKit.

No other files need to change.

---

## Railway Deployment Notes

- Deployments trigger automatically on `git push` to `main`.
- Migrations run at container startup via `npx prisma migrate deploy`.
- Upload files (vendor photos, applicant documents) live on a Railway Volume mounted at `/app/backend/uploads`. They are **not** in the Docker image.
- After first deploy, upload the Solar Wiring Diagram PDF via Admin → Document Master → Solar Wiring Diagram → Upload File.
