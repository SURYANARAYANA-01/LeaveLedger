# LeaveLedger

> PTO requests, approvals, and balance tracking for managers, HR, and leadership — with a role model deep enough that a Manager, HR, and CEO each see a genuinely different, correctly-scoped view of the company.

**Live demo → _add your deployed URL here once live_**

## Features

- Multi-tenant company registration — sign up your company, get a CEO account, invite the rest of your team
- Four-role hierarchy (Employee / Manager / HR / CEO) with server-enforced, per-role visibility and permissions — not just hidden UI
- Leave request submission, balance tracking, and a role-scoped approvals queue with quick approve/reject
- Personal + team dashboards per role, with an interactive animated donut chart of leave-type distribution
- Role-scoped User Directory, grouped by role, with add/edit permissions that match who's allowed to manage whom
- Company holiday calendar and team leave calendar
- Light/dark theme, system-aware

## Tech Stack

Next.js (App Router) · TypeScript · PostgreSQL (Prisma) · Tailwind CSS · Auth.js (NextAuth v5) · Zod

## Quick Start

```bash
git clone https://github.com/SURYANARAYANA-01/LeaveLedger.git && cd LeaveLedger
cp .env.example .env      # then fill in DATABASE_URL and AUTH_SECRET
npm install
npx prisma migrate dev    # applies schema, creates tables
npx prisma db seed        # seeds one demo company + 4 demo accounts
npm run dev                # http://localhost:3000
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session signing secret for Auth.js — generate with `npx auth secret` |

## Architecture

Multi-tenant: every company that registers gets its own `Company` row, and every user, leave request, and directory/approval query is scoped by `companyId` so tenants never see each other's data. Authorization is enforced server-side on every route and API handler — role checks never rely on what the client sends. See [`docs/architecture.md`](docs/architecture.md) for the data model and the role/permission matrix.

## Demo credentials

All seeded accounts use the password `demo1234`:

| Role | Email |
| --- | --- |
| CEO | ceo@leaveledger.com |
| HR | HR@leaveledger.com |
| Manager | manager@leaveledger.com |
| Employee | demo@leaveledger.com |

## Testing

```bash
npm run lint         # ESLint
npx tsc --noEmit      # TypeScript strict check
```

## Roadmap

- [ ] Deploy to Vercel with a live demo URL
- [ ] CSV export for leave requests and the user directory
- [ ] Audit/activity log for approvals
- [ ] Cmd+K command palette

## Screenshots

_Add screenshots of the Manager, HR, and CEO dashboards, the User Directory, and the Approvals Queue here — see `docs/screenshots/`._

## License

MIT — see [LICENSE](LICENSE).

---

Built as part of the [Digital Heroes](https://www.linkedin.com/in/prasunanand/) Full Stack Developer Trial.
