# Architecture

## Data model

Core entities and relationships (see `prisma/schema.prisma` for the full schema):

- **Company** — root of multi-tenancy. Every `User` belongs to exactly one company.
- **User** — has a `role` (`EMPLOYEE` / `MANAGER` / `ADMIN` / `CEO`), an optional `managerId` (self-relation forming the reporting chain), an optional `departmentId`, and belongs to a `Company`.
- **LeaveRequest** — belongs to a `User`, references a `LeaveType`, has a `status` (`PENDING` / `APPROVED` / `REJECTED`) and a date range.
- **LeaveBalance** — per-user, per-leave-type, per-year allocation/used/pending counters.
- **Department**, **Holiday**, **LeaveType**, **Notification**, **CeoSchedule** — supporting entities. (Note: these are currently shared across all companies, not yet company-scoped — see "Known limitations" below.)

## Authentication & Authorization

- Auth.js (NextAuth v5) with a credentials provider; passwords hashed with bcrypt.
- Session/JWT carries `id`, `role`, `departmentId`, and `companyId` — every server component and API route reads authorization from the session, never from client-supplied data.
- Role checks and company-scoping happen at the query level (Prisma `where` clauses), not just in the UI — a Manager calling the Users API directly, for example, still can't fetch another company's data or promote someone to HR.

## Role & permission matrix

| Action | Employee | Manager | HR (Admin) | CEO |
| --- | --- | --- | --- | --- |
| View own leave / apply for leave | ✅ | ✅ | ✅ | ✅ |
| View User Directory | ❌ | Employees only | Manager + Employee | Everyone |
| Add user | ❌ | Employee only | Manager or Employee | Anyone |
| Edit user | ❌ | Employees only | Manager + Employee | Anyone |
| Review leave requests | ❌ | Employees only | Manager + Employee | Manager + HR |
| Manage holidays | ❌ | ❌ | ✅ | ✅ |

Each row above is enforced twice: once in the UI (hiding actions that aren't allowed) and once in the corresponding API route (rejecting the request even if the UI check were bypassed).

## Multi-tenancy

Registering via `/register` creates a new `Company` and its first user as `CEO` — no other role can be created through that public endpoint. Every subsequent account (HR, Manager, Employee) is created by an already-authenticated user with sufficient permission, via `/api/users`, which always stamps the new user with the **creator's** `companyId` — it never trusts a company ID from the client.

### Known limitations (disclosed, not hidden)

`Department`, `LeaveType`, and `Holiday` are currently shared/global across all companies rather than scoped per-company. For a demo/trial project this keeps the data model simpler, but a genuinely multi-tenant SaaS product would scope these too, so one company's custom leave types or holiday calendar don't leak into another's. This is the top item on the roadmap if the project continues past the trial.

## Key trade-offs

- **No department-level customization per company (yet)** — traded off to ship the higher-value user/request/approval isolation first, since that's where real data privacy risk lives.
- **Approvals scope is role-based, not strictly "direct manager only"** — HR can review any Manager or Employee's request (not just their own direct reports), and CEO reviews any Manager or HR request. This matches how a small-to-mid-size company actually delegates approval authority, rather than forcing a rigid one-level-up chain.
