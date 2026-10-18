# HireConnect

HireConnect is a modern, full-featured Job Portal web application connecting job seekers and employers with comprehensive administrative oversight.

---

## Tech Stack

- **Backend**:
  - .NET 8 Web API
  - Entity Framework Core 8 with Pomelo MySQL Provider
  - ASP.NET Core Identity (with brute-force lockout protection)
  - JWT Authentication with HTTP-only Refresh Tokens
  - SignalR (Real-time Messaging)
  - PayHere Payment Gateway integration
- **Frontend**:
  - Next.js (App Router, Turbopack)
  - React, TypeScript
  - Tailwind CSS
  - Zustand (Client State Management)
  - React Hook Form & Zod (Form Validation)
  - TanStack Query (Data Fetching & Caching)
  - Lucide React & React Icons

---

## Ports & Endpoints

| Service | Protocol | Local URL | Description |
|---|---|---|---|
| **Frontend** | HTTP | `http://localhost:3000` | Next.js Client Application |
| **Backend API** | HTTP | `http://localhost:5189` | ASP.NET Core Web API |
| **Backend API (SSL)** | HTTPS | `https://localhost:7200` | Optional HTTPS profile |
| **API Base URL** | HTTP | `http://localhost:5189/api` | REST API Root (Matches `api.ts` fallback) |
| **Swagger UI** | HTTP | `http://localhost:5189/swagger` | Interactive API documentation |

---

## Environment Variables

### 1. Backend (`backend/appsettings.json` or environment variables)

You can configure settings via `appsettings.json` or by creating a `.env` file in `backend/` (refer to `backend/.env.example`):

| Variable / Key | Default / Example | Description |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | `Server=localhost;Port=3306;Database=HireConnectDB;User=root;Password=;` | MySQL connection string |
| `Jwt__Key` | *(Secret 32+ character key)* | Secret key for signing JWT tokens |
| `Jwt__Issuer` | `HireConnectAPI` | Valid token issuer |
| `Jwt__Audience` | `HireConnectClient` | Valid token audience |
| `Jwt__ExpireMinutes` | `15` | Access token lifespan in minutes |
| `Jwt__RefreshExpireDays` | `7` | Refresh token lifespan in days |
| `CookieSettings__SameSite` | `Lax` (dev) / `None` (prod) | Refresh token cookie SameSite policy |
| `CookieSettings__Secure` | `false` (dev) / `true` (prod) | Refresh token cookie Secure flag |
| `PayHere__MerchantId` | `1234567` | PayHere payment merchant ID |
| `PayHere__MerchantSecret` | `your_payhere_secret` | PayHere merchant secret key |
| `EmailSettings__SmtpHost` | `smtp.example.com` | SMTP host for password resets |
| `EmailSettings__SmtpPort` | `587` | SMTP port |
| `EmailSettings__SenderEmail` | `noreply@hireconnect.com` | Sender email address |
| `EmailSettings__EnableSsl` | `true` | Enable TLS/SSL for SMTP |

### 2. Frontend (`frontend/.env.local`)

| Variable | Default Fallback | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5189/api` | Base URL of the backend API |

---

## Local Setup Instructions

### Prerequisites
- **MySQL Server** (via XAMPP, MySQL Workbench, or Docker) running on port `3306`.
- **.NET 8 SDK** or newer installed.
- **Node.js** (v18.x or v20.x+) and `npm`.

---

### Step 1: Database & Backend Setup

1. **Start MySQL** (e.g. from XAMPP Control Panel start `MySQL`).
2. Open a terminal in the `backend/` folder:
   ```bash
   cd backend
   ```
3. Verify your connection string in `appsettings.json` or `.env`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Port=3306;Database=HireConnectDB;User=root;Password=;"
   }
   ```
4. Restore NuGet packages and apply EF Core database migrations:
   ```bash
   dotnet restore
   dotnet ef database update
   ```
   *(This automatically creates the `HireConnectDB` database and tables).*
5. Run the backend Web API:
   ```bash
   dotnet run
   ```
   The backend will be available at `http://localhost:5189`. You can view API documentation at `http://localhost:5189/swagger`.

---

### Step 2: Frontend Setup

1. Open a new terminal in the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. (Optional) Create `.env.local` if using a custom backend port:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5189/api
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Security & Architecture Highlights

- **Brute-Force Account Protection**: ASP.NET Core Identity is configured with a 15-minute account lockout after 5 consecutive failed login attempts.
- **Concurrent Token Refresh**: Frontend Axios interceptor enforces a single in-flight refresh token request with a shared promise queue and skips refresh on auth routes.
- **Token Invalidation on Password Change/Reset**: Changing or resetting user password immediately revokes all active refresh tokens for that user.
- **Config-Driven Cross-Origin Cookies**: Refresh token cookie `SameSite` and `Secure` attributes are dynamically configured for both local HTTP (`Lax`/`false`) and production cross-domain HTTPS (`None`/`true`).
- **Input Validation & Anti-Tampering**: Resume uploads enforce 5MB limits and PDF/DOC/DOCX extensions. Payment webhooks rigorously verify signatures, currency, amount, and merchant ID.
- **Sensitive Data Isolation**: Admin and public endpoints return dedicated projections/DTOs, preventing exposure of `PasswordHash` or `SecurityStamp`.
