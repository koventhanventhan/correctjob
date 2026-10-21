# HireConnect - Comprehensive Job Portal Platform

HireConnect is an enterprise-grade, full-featured Job Portal web application connecting Job Seekers and Employers with comprehensive Administrative moderation, real-time communications, secure payments, and strict data governance.

---

## Architecture & Technology Stack

- **Backend**:
  - ASP.NET Core Web API (.NET 10 / C#)
  - Entity Framework Core 8 with Pomelo MySQL Provider
  - ASP.NET Core Identity with automated 15-minute brute-force lockout protection (5 failed attempts)
  - Built-in `Microsoft.AspNetCore.RateLimiting` IP-based partitioned rate limiters
  - JWT Authentication with HTTP-Only, cross-domain Refresh Token cookies
  - Real-time SignalR Hubs for instant applicant-employer messaging
  - PayHere Payment Gateway integration with cryptographically verified server-to-server notifications
  - PDF & DOCX text extraction via PdfPig and OpenXml for automated resume parsing
  - SHA256 IP-hashing and immutable Audit Logging
- **Frontend**:
  - Next.js (App Router, Turbopack)
  - React & TypeScript (Strict Type Safety)
  - Tailwind CSS with responsive design (375px mobile, 768px tablet, 1280px+ desktop)
  - Zustand for client-side authentication and session state
  - React Hook Form & Zod for robust client validation
  - TanStack React Query for background synchronization and data caching
  - Lucide React & React Icons for modern typography and iconography

---

## Role-Based Feature Matrix

### 1. Job Seeker
- **Authentication & Security**: Multi-factor authentication ready, password reset via secure email tokens, mandatory password change enforcement, and automatic session revocation across all devices upon password update.
- **Profile Building & Resumes**: Comprehensive profile creation with work histories, degrees/education, skill tags with years of experience, spoken languages with proficiency levels, and verified certifications.
- **Multiple Resume Management**: Upload and manage multiple resume documents (PDF/DOCX max 5MB); designate a default resume for 1-click applications.
- **Identity Verification**: Secure front and back government ID card upload with strict MIME verification, encrypted/private storage, and verification badge display.
- **Job Search & Discovery**: Real-time faceted search by keyword, category, location, job type (Full-time, Part-time, Contract, Internship), remote status, and salary range.
- **Job Alerts & Bookmarks**: Custom job search alert subscriptions based on preferred filters; save jobs to personal shortlist.
- **Application Flow**: Apply using uploaded resumes or profile data; answer custom employer screening questions; track real-time application status (Applied, Under Review, Shortlisted, Interview, Hired, Rejected).
- **Calendar Integration**: Download `.ics` calendar invitation files directly for scheduled interviews.
- **Talent Inquiries & Invitations**: Receive direct invitations from verified employers to apply for specific openings; accept or decline with a personal message.
- **Real-Time Communication**: In-app chat directly with hiring managers once an application is active.
- **Community Safety**: Submit structured reports against suspicious jobs or abusive employer reviews.

### 2. Employer
- **Company Branding**: Dedicated profile management including high-resolution logo, banner, overview, employee headcount, industry, benefits list, and social profiles (LinkedIn, Twitter, Facebook, Website).
- **Employer Identity Verification**: Upload corporate/owner identity cards (front & back) to earn the verified employer status.
- **Job Lifecycle Management**: Post jobs, save as drafts, submit for admin approval, and pay posting fees through PayHere. Manage active vacancies: close openings, reopen with updated deadlines, or duplicate existing jobs.
- **Screening Questions**: Add custom required or optional screening questions (text, yes/no, multiple-choice) to filter applicants automatically.
- **Application Management Pipeline**: Filter and view applicants per job, update applicant statuses, assign 1-5 star ratings, and record internal employer notes.
- **Candidate Discovery & Outreach**: Search the open-to-work candidate directory by skill, title, and location; send direct application invitations (rate-limited to 20/day per employer).
- **Applicant Messaging**: SignalR-powered direct chat with applicants attached to their application context.
- **Employer Analytics**: Live overview of total views, active job count, application pipeline metrics, and interview counts.

### 3. Administrator
- **Operational Dashboard**: Real-time KPI counters (active jobs, verified companies, registered job seekers, pending moderation items, platform revenue).
- **Job Moderation**: Review submitted postings; approve or reject with custom feedback notifications; emergency job closure with automated employer notification.
- **Verification Review**: Side-by-side inspection of Job Seeker and Employer ID card documents through secure, non-public streaming endpoints; approve or reject with reason notes.
- **User Governance**: Search and filter all registered users; block/unblock accounts with mandatory reason logging; provision new administrators or revoke existing permissions.
- **System Settings Control**: Live updates to `SiteName`, `ContactEmail` (with format validation), `JobPostingFee` (validated between 0 and 1,000,000), and `MaintenanceMode` toggle with confirmation modal (non-admins receive 503 while admin retains uninterrupted access).
- **Taxonomy Management**: Add, rename, or deactivate job categories and geographic locations with uniqueness enforcement and foreign key deletion guards.
- **Reports & Content Moderation**: Comprehensive moderation queue for reported jobs and reviews; take immediate administrative action (close job, hide review, delete review) with automated audit logging.
- **Immutable Audit Logs**: Tamper-evident administrative activity log capturing timestamps, action types, target IDs, changes diffs, and privacy-preserving SHA256 hashed client IPs (`IpHashSalt`).
- **Secure CSV Exports**: Export filtered datasets (Users, Jobs) with automatic formula injection neutralization (prepends `'` to cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`).

---

## Ports & Endpoints

| Service | Protocol | Local URL | Description |
|---|---|---|---|
| **Frontend** | HTTP | `http://localhost:3000` | Next.js Client Application |
| **Backend API** | HTTP | `http://localhost:5000` (or `5189`) | ASP.NET Core Web API |
| **Backend API (SSL)** | HTTPS | `https://localhost:7200` | Local HTTPS profile |
| **API Base URL** | HTTP | `http://localhost:5000/api` | REST API Root Endpoint |
| **Swagger UI** | HTTP | `http://localhost:5000/swagger` | API Documentation (*Development Mode Only*) |
| **SignalR Chat Hub** | WSS / WS | `http://localhost:5000/chatHub` | Real-time Applicant Chat Hub |

---

## Environment Variables

### 1. Backend (`backend/.env` or OS Environment Variables)

Refer to [`backend/.env.example`](backend/.env.example) for exact formatting. In production, startup **fails immediately** if any required key is missing or set to placeholder text.

| Variable / Key | Required in Prod | Example / Default | Purpose |
|---|:---:|---|---|
| `ConnectionStrings__DefaultConnection` | **Yes** | `Server=localhost;Port=3306;Database=HireConnectDB;User=root;Password=;` | MySQL database connection string |
| `Jwt__Key` | **Yes** | *(Secret min 32 characters)* | Cryptographic key for signing JWT tokens |
| `Jwt__Issuer` | No | `HireConnectAPI` | Valid JWT Issuer claim |
| `Jwt__Audience` | No | `HireConnectClient` | Valid JWT Audience claim |
| `Jwt__ExpireMinutes` | No | `15` | Access token lifetime in minutes |
| `Jwt__RefreshExpireDays` | No | `7` | Refresh token lifetime in days |
| `Security__IpHashSalt` | **Yes** | *(Secret min 32 characters)* | Salt used for GDPR-compliant audit log IP hashing |
| `Admin__Email` | **Yes** | `admin@hireconnect.com` | Email of initial administrator account |
| `Admin__Password` | **Yes** | *(Strong password)* | Initial administrator password |
| `EmailSettings__SmtpHost` | **Yes** | `smtp.mailprovider.com` | SMTP host for emails & password resets |
| `EmailSettings__SmtpPort` | No | `587` | SMTP port |
| `EmailSettings__SmtpUsername` | **Yes** | `smtp-user@domain.com` | SMTP username |
| `EmailSettings__SmtpPassword` | **Yes** | *(Secret password)* | SMTP password |
| `EmailSettings__SenderEmail` | No | `noreply@hireconnect.com` | Outgoing sender email address |
| `EmailSettings__SenderName` | No | `HireConnect` | Outgoing sender display name |
| `EmailSettings__EnableSsl` | No | `true` | Enforce SSL/TLS for SMTP transport |
| `PayHere__MerchantId` | **Yes** | `1234567` | PayHere merchant identifier |
| `PayHere__MerchantSecret` | **Yes** | *(Secret)* | PayHere secret key for MD5 checksum validation |
| `CookieSettings__SameSite` | No | `Lax` (dev) / `None` (prod) | Refresh token cookie SameSite policy |
| `CookieSettings__Secure` | No | `false` (dev) / `true` (prod) | Refresh token cookie Secure HTTPS flag |
| `Cors__AllowedOrigins__0` | **Yes** | `https://hireconnect.com` | Strict CORS allowed production origins |
| `FrontendUrl` | No | `https://hireconnect.com` | Base frontend URL used in generated email links |

### 2. Frontend (`frontend/.env.local` or OS Environment Variables)

Refer to [`frontend/.env.example`](frontend/.env.example).

| Variable | Required | Default Fallback | Purpose |
|---|:---:|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:5000/api` | Base URL used by client-side Axios requests |

---

## Setup & Local Development Guide

### Prerequisites
- **MySQL Server** (8.0+ or MariaDB 10.5+) running on port `3306`.
- **.NET 10 SDK** (or .NET 8 SDK).
- **Node.js** (v18.x or v20.x+) and `npm`.

---

### Step 1: Database & Backend Setup

1. Start your local MySQL instance (e.g. through XAMPP or Docker).
2. Open terminal in `backend/`:
   ```bash
   cd backend
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to verify your local MySQL credentials (`ConnectionStrings__DefaultConnection`), initial `Admin__Email`, and `Admin__Password`.*
4. Restore dependencies and verify build:
   ```bash
   dotnet restore
   dotnet build
   ```
5. Apply database migrations:
   ```bash
   dotnet ef database update
   ```
   *(This applies all EF Core migrations and sets up all required tables, indexes, and constraints).*
6. Start the backend Web API:
   ```bash
   dotnet run
   ```
   *Upon initial launch, the system automatically creates the `Admin`, `Employer`, and `JobSeeker` roles, and provisions the default administrator account from your configuration.*

---

### Step 2: Frontend Setup

1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   ```
2. Copy environment configuration:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start Next.js development server:
   ```bash
   npm run dev
   ```
5. Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Administrator Provisioning

The platform includes automated, secure administrator seeding:
1. Define `Admin__Email` and `Admin__Password` in `backend/.env` (or environment variables).
2. When the backend starts up, `Program.cs` inspects the database:
   - If no user exists with the configured `Admin__Email`, it creates the user with `MustChangePassword = false`, `IsActive = true`, and assigns the `Admin` role.
   - If the account already exists, it is untouched.
3. You can immediately log in via `http://localhost:3000/login` using these credentials to access `/admin/dashboard`.
4. From the Admin dashboard, existing administrators can provision additional admin accounts or revoke access at any time.

---

## Database Migration Protocol

### Safety Rules
- **NEVER** run migrations in production without first taking a full database backup.
- In production, set `"Database:AutoMigrate": false` to prevent accidental schema changes during blue-green deployments or multi-instance scaling.

### Creating a New Migration (Development Only)
When making modifications to `AppDbContext` or model entities:
```bash
cd backend
dotnet ef migrations add <DescriptiveMigrationName>
```

### Applying Migrations to the Database
```bash
# 1. Take a backup of your MySQL database
mysqldump -u root -p HireConnectDB > hireconnect_backup_$(date +%Y%m%d).sql

# 2. Apply the migration
dotnet ef database update
```

---

## Security Hardening & Defenses

1. **Partitioned IP Rate Limiting**:
   - `Login`: 10 requests / minute per client IP (HTTP 429).
   - `Register`: 5 requests / minute per client IP (HTTP 429).
   - `Forgot Password` & `Reset Password`: 3 requests / minute per client IP (HTTP 429).
   - `Change Password`: 5 requests / minute per client IP (HTTP 429).
   - `Refresh Token`: 20 requests / minute per client IP (HTTP 429).
2. **Reverse Proxy Real-IP Preservation**:
   - `UseForwardedHeaders` configured with `XForwardedFor` and `XForwardedProto` ensures client rate limiting and audit hashing operate on actual client IP addresses instead of the load balancer IP.
3. **HTTP Security Headers**:
   - `X-Content-Type-Options: nosniff` (mitigates MIME-confusion attacks).
   - `X-Frame-Options: DENY` (prevents clickjacking).
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - `X-XSS-Protection: 1; mode=block`.
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (enforced in production).
   - Configured in both ASP.NET Core middleware and Next.js `next.config.ts`.
4. **Upload & Body Request Caps**:
   - Kestrel and FormOptions capped at 15MB globally.
   - Granular `[RequestSizeLimit]` on endpoints (Profile images: 2MB, Logos: 3MB, Resumes: 5MB, Banners: 6MB, Applications & ID cards: 10-12MB).
5. **Private Document Storage**:
   - Resumes and government ID cards are stored in a dedicated `private_uploads` folder outside the static root.
   - Direct static URL requests to `/uploads/resumes/` or `/uploads/id-cards/` are actively intercepted and blocked with HTTP 403.
   - Files are exclusively served through authenticated controllers that verify user identity, role, and record ownership.
6. **Strict CORS Policy**:
   - Production enforces non-wildcard origins loaded exclusively from `Cors:AllowedOrigins`. Wildcards (`*`) or empty configurations trigger a fatal startup exception in production.
7. **Production Swagger Lockdown**:
   - Swagger OpenAPI generation and Swagger UI are strictly guarded by `if (app.Environment.IsDevelopment())`.
8. **CSV Formula Injection Defense**:
   - CSV exports automatically prefix vulnerable characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with a single quote (`'`), neutralizing spreadsheet formula execution in Excel and Google Sheets.
9. **GDPR/Privacy Audit Logging**:
   - Client IPs in audit logs are irreversibly hashed using HMAC-SHA256 with a high-entropy secret salt (`Security:IpHashSalt`). Plaintext IP addresses are never persisted.
