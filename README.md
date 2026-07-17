# LeaveLedger

> Leave request, approval, and balance tracking for teams — with four distinct role views (Employee, Manager, HR, CEO) enforced end-to-end on the server.

![Hero screenshot](docs/CEO%20Dashboard.png)

[![CI](https://github.com/SURYANARAYANA-01/LeaveLedger/actions/workflows/ci.yml/badge.svg)](https://github.com/SURYANARAYANA-01/LeaveLedger/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live demo → https://leave-ledger-nine.vercel.app**

## Features

- **Registers a company** — sign up with email/password or Google and become the CEO; every subsequent account joins via an invite link
- **Four-role hierarchy** (Employee / Manager / HR / CEO) with server-enforced, per-role scoping — not just hidden UI buttons
- **Invite-based onboarding** — HR/Manager/CEO adds a teammate by email; the invitee clicks a signed link and sets their own password before the account activates
- **Leave request & approval workflow** — submit, track, approve or reject; balances update automatically
- **Role-scoped dashboards** — each role sees a genuinely different view with relevant stats, charts, and quick actions
- **Team & holiday calendars** — interactive calendar showing who's off and company-wide public holidays
- **User Directory** — add, edit, deactivate, and delete teammates with permissions that match the role matrix
- **Light / dark theme**, system-aware, with persistent preference

## Tech Stack

Next.js 16 (App Router) · TypeScript · PostgreSQL (Prisma ORM) · Tailwind CSS v4 · Auth.js (NextAuth v5) · Zod · Resend · Vitest · Vercel

## Quick Start

```bash
git clone https://github.com/SURYANARAYANA-01/LeaveLedger.git && cd LeaveLedger
cp .env.example .env        # then fill in the values below
npm install
npx prisma migrate dev      # applies schema, creates tables
npx prisma db seed          # seeds one demo company + 4 demo accounts
npm run dev                 # http://localhost:3000
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@host/db?sslmode=require`) |
| `AUTH_SECRET` | Session signing secret — generate with `npx auth secret` |
| `AUTH_URL` | Base URL of the app (`http://localhost:3000` locally, or your deployed URL) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID — [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Sends invite-verification emails — [resend.com](https://resend.com). Without a key, invite links are logged to the server console so the flow is still testable locally |
| `RESEND_FROM_EMAIL` | Sender address used in invite emails (e.g. `LeaveLedger <onboarding@resend.dev>`) |
| `NEXT_PUBLIC_APP_URL` | Used to build absolute links inside emails |

See [`.env.example`](.env.example) for the full annotated list.

## Architecture

Multi-tenant: each company that registers gets its own `Company` row, and every user, leave request, and query is scoped by `companyId` so tenants never see each other's data. Authorization is enforced server-side on every route and API handler — role checks never rely on what the client sends.

See [`docs/architecture.md`](docs/architecture.md) for the full data model diagram, auth/invite flow, role permission matrix, and key trade-offs.

## Demo Credentials

All seeded accounts use the password **`demo1234`**:

| Role | Email |
| --- | --- |
| CEO | `ceo@leaveledger.com` |
| HR | `HR@leaveledger.com` |
| Manager | `manager@leaveledger.com` |
| Employee | `demo@leaveledger.com` |

## Testing

```bash
npm run test          # Vitest — business-logic unit tests
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript strict check
npm run build         # production build smoke-test
```

CI runs all four on every push and pull request — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Roadmap

- [x] Multi-tenant company registration and isolation
- [x] Four-role hierarchy with server-enforced permissions
- [x] Invite-based user onboarding with email verification
- [x] Leave request, approval, and balance workflow
- [x] Role-scoped dashboards, calendars, and user directory
- [x] Deploy to Vercel with live demo
- [ ] CSV export for leave requests and the user directory
- [ ] Audit / activity log for approvals
- [ ] Cmd+K command palette
- [ ] Scope Department, LeaveType, and Holiday per company (currently shared — see `docs/architecture.md`)

## Screenshots

| Login | Employee Dashboard | CEO Dashboard |
|---|---|---|
| ![Login](docs/login%20page.png) | ![Employee Dashboard](docs/Employee%20Dashboard.png) | ![CEO Dashboard](docs/CEO%20Dashboard.png) |

## License

MIT — see [LICENSE](LICENSE).

---

Built as part of the [Digital Heroes](https://www.linkedin.com/in/prasunanand/) Full Stack Developer Trial.