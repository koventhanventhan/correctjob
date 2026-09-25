# HireConnect

A production-quality job portal web application.

## Tech Stack
- **Backend**: .NET 8 Web API, Entity Framework Core, MySQL, ASP.NET Core Identity, JWT Auth.
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, Zustand, React Hook Form, Zod, TanStack Query.

## Project Structure
- `backend/`: The .NET 8 Web API project.
- `frontend/`: The Next.js React application.

## Local Setup Instructions

### 1. Backend Setup

1. Open a terminal in the `backend/` directory.
2. Restore NuGet packages:
   ```bash
   dotnet restore
   ```
3. The application is configured to use `MySQL`. Ensure you have MySQL running locally, and the `DefaultConnection` string in `backend/appsettings.json` is correct (e.g., pointing to your root user).
4. Apply Entity Framework migrations to create the database:
   ```bash
   dotnet ef database update
   ```
   *(Note: The `InitialCreate` migration is already generated in the Migrations folder).*
5. Run the API:
   ```bash
   dotnet run
   ```
   The API will start (usually on `http://localhost:5189` or `https://localhost:7200`).

### 2. Frontend Setup

1. Open a terminal in the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set the API URL. Create a `.env.local` file in `frontend/` (if your backend runs on a different port than `5189`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5189/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features Implemented (MVP)
- **Role-Based Auth**: Secure JWT-based auth with `httpOnly` refresh tokens.
- **Job Seeker Flow**: Register, search jobs with filters, view job details, apply.
- **Employer Flow**: Register company, post jobs (with Admin approval workflow), view applicants, manage application status.
- **Admin Flow**: Dashboard to approve/reject jobs, companies, and block users.
- **Security**: Strict ownership checks on mutating endpoints (`403 Forbidden` if a user tries to edit someone else's data). Resume files are protected behind authorization.
