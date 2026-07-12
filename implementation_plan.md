# LeaveLedger — Enterprise Leave Management System

> A modern, enterprise-grade Leave Management System that simplifies leave workflows through an intuitive interface, automated approvals, role-based access, and real-time insights — built for employees, managers, and HR teams.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 14+ (App Router)** | SSR, API routes, server actions in one repo |
| Language | **TypeScript (strict mode)** | Type safety, no `any` ever |
| UI | **React + Tailwind CSS + shadcn/ui** | Accessible primitives, rapid development |
| Database | **PostgreSQL via Neon/Supabase** | Production-grade, managed Postgres |
| ORM | **Prisma** | Typed queries, migrations in git |
| Auth | **Auth.js (NextAuth v5)** | Credentials provider + role-based sessions |
| Validation | **Zod** | Every boundary — forms, API, env |
| State/Data | **TanStack Query + Server Actions** | Efficient data fetching, cache invalidation |
| Tooling | **ESLint + Prettier, Vitest, Playwright** | Linting, unit tests, e2e tests |
| Hosting | **Vercel** (frontend) + Managed Postgres | Zero-config deployment |

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Employee** | Apply for leave, view own balance/history, view team calendar, update profile |
| **Manager** | All Employee permissions + approve/reject team requests, view team analytics, view team availability |
| **HR/Admin** | All permissions + manage leave types/policies, manage users, manage holidays, view org-wide reports, configure system settings |

---

## Core Features (MVP)

### 1. Authentication & Authorization
- Credentials-based login (email + password) via Auth.js
- Role-based access control (Employee, Manager, HR/Admin)
- Protected routes with middleware
- Demo credentials: `demo@leavledger.com / demo1234` (Employee), `manager@leavledger.com / demo1234` (Manager), `admin@leavledger.com / demo1234` (HR/Admin)
- Session management with JWT

### 2. Dashboard (Role-Specific)
- **Employee Dashboard**: Leave balance cards, recent requests, upcoming holidays, quick-apply widget
- **Manager Dashboard**: Pending approvals count, team availability today, team leave trends chart, action items
- **HR/Admin Dashboard**: Organization-wide statistics, leave utilization heatmap, department-wise breakdown, policy compliance alerts

### 3. Leave Management
- **Leave Types**: Annual, Sick, Personal, Maternity/Paternity, Bereavement, Unpaid, Work From Home, Compensatory Off
- **Apply for Leave**: Date range picker, leave type selector, reason field, half-day option, attachment upload support
- **Leave Balance**: Visual balance cards per type, accrual tracking, carry-forward rules
- **Leave History**: Filterable/sortable table, status badges, cancel option for pending requests

### 4. Approval Workflow
- **Manager Approval Queue**: List of pending requests with employee details, quick approve/reject with comments
- **Multi-level Approval**: Configurable approval chain (direct manager → HR)
- **Bulk Actions**: Approve/reject multiple requests at once
- **Email Notifications**: On request submission, approval, rejection, cancellation

### 5. Team Calendar
- Month/week view showing team availability
- Color-coded leave types
- Filter by department/team
- Holiday overlay
- Conflict detection (too many team members off)

### 6. Holiday Calendar
- Organization-wide holiday management
- Regional/location-based holidays
- Public holiday auto-import capability
- Custom holiday creation (HR/Admin only)

### 7. Reports & Analytics
- **Leave Utilization Report**: By employee, department, leave type
- **Trend Analysis**: Monthly/quarterly leave patterns
- **Absenteeism Report**: Frequency and patterns
- **Export**: CSV/PDF download
- **Charts**: Bar, line, pie charts using Recharts

### 8. User & Organization Management (HR/Admin)
- Employee directory with department/team assignment
- Leave policy configuration per role/department
- Leave type management (create, edit, deactivate)
- Bulk user import (CSV)
- Audit log of all system actions

---

## Proposed Changes

### Database Schema (Prisma)

#### [NEW] [schema.prisma](file:///d:/Projects/LeaveLedger/prisma/schema.prisma)

Core models:

```prisma
model User {
  id, email, name, password (hashed), role (EMPLOYEE/MANAGER/HR_ADMIN),
  department, managerId (self-relation), avatar, isActive, createdAt, updatedAt
}

model Department {
  id, name, description, headId (FK → User), createdAt
}

model LeaveType {
  id, name, description, defaultBalance, color, icon,
  isPaid, requiresApproval, maxConsecutiveDays, isActive
}

model LeaveBalance {
  id, userId, leaveTypeId, year, totalBalance, usedBalance, 
  pendingBalance, carriedForward
}

model LeaveRequest {
  id, userId, leaveTypeId, startDate, endDate, 
  isHalfDay, halfDayPeriod (MORNING/AFTERNOON),
  totalDays, reason, status (PENDING/APPROVED/REJECTED/CANCELLED),
  approverId, approverComment, appliedAt, respondedAt
}

model Holiday {
  id, name, date, type (PUBLIC/COMPANY/OPTIONAL), 
  isRecurring, location, createdBy
}

model Notification {
  id, userId, title, message, type, isRead, 
  linkTo, createdAt
}

model AuditLog {
  id, userId, action, entity, entityId, 
  oldValues (JSON), newValues (JSON), createdAt
}
```

---

### Project Structure

```
d:\Projects\LeaveLedger\
├── .github/
│   ├── workflows/ci.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── architecture.md
│   └── screenshots/
├── prisma/
│   └── schema.prisma
├── public/
│   └── (favicon, og-image, etc.)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Sidebar + topbar layout
│   │   │   ├── page.tsx            # Dashboard (role-specific)
│   │   │   ├── leave/
│   │   │   │   ├── apply/page.tsx
│   │   │   │   ├── history/page.tsx
│   │   │   │   └── balance/page.tsx
│   │   │   ├── approvals/page.tsx   # Manager
│   │   │   ├── calendar/page.tsx    # Team calendar
│   │   │   ├── holidays/page.tsx
│   │   │   ├── reports/page.tsx     # HR/Admin
│   │   │   ├── users/page.tsx       # HR/Admin
│   │   │   ├── settings/page.tsx    # HR/Admin
│   │   │   └── profile/page.tsx
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Landing/redirect
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── breadcrumb.tsx
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   ├── leave-balance-card.tsx
│   │   │   ├── recent-requests.tsx
│   │   │   └── charts/
│   │   ├── leave/
│   │   │   ├── apply-form.tsx
│   │   │   ├── request-card.tsx
│   │   │   └── status-badge.tsx
│   │   ├── approvals/
│   │   │   ├── approval-card.tsx
│   │   │   └── approval-actions.tsx
│   │   ├── calendar/
│   │   │   └── team-calendar.tsx
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── page-header.tsx
│   │       └── empty-state.tsx
│   ├── lib/
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── auth.ts                  # Auth.js config
│   │   ├── utils.ts                 # cn() + helpers
│   │   └── validators/
│   │       ├── leave.ts             # Zod schemas
│   │       └── user.ts
│   ├── server/
│   │   ├── actions/
│   │   │   ├── leave.ts             # Server actions for leave CRUD
│   │   │   ├── approval.ts
│   │   │   ├── user.ts
│   │   │   └── holiday.ts
│   │   └── queries/
│   │       ├── dashboard.ts
│   │       ├── leave.ts
│   │       ├── reports.ts
│   │       └── calendar.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### Implementation Phases

#### Phase 1: Foundation (Project Setup)
| # | File/Task | Description |
|---|-----------|-------------|
| 1 | Initialize Next.js project | `npx create-next-app@latest` with TypeScript, Tailwind, App Router, ESLint |
| 2 | Install dependencies | shadcn/ui, Prisma, Auth.js, Zod, Recharts, date-fns, TanStack Query, bcryptjs |
| 3 | Configure shadcn/ui | Dark/light theme, custom color palette (indigo/violet primary) |
| 4 | [schema.prisma](file:///d:/Projects/LeaveLedger/prisma/schema.prisma) | Full database schema with all models |
| 5 | [seed.ts](file:///d:/Projects/LeaveLedger/prisma/seed.ts) | Demo data: 3 users (employee, manager, admin), leave types, balances, sample requests, holidays |
| 6 | [db.ts](file:///d:/Projects/LeaveLedger/src/lib/db.ts) | Prisma client singleton |
| 7 | [auth.ts](file:///d:/Projects/LeaveLedger/src/lib/auth.ts) | Auth.js config with credentials provider |
| 8 | `.env.example` | All required environment variables |

#### Phase 2: Layout & Auth
| # | File/Task | Description |
|---|-----------|-------------|
| 1 | [login/page.tsx](file:///d:/Projects/LeaveLedger/src/app/(auth)/login/page.tsx) | Beautiful login page with glassmorphism, gradient background |
| 2 | [sidebar.tsx](file:///d:/Projects/LeaveLedger/src/components/layout/sidebar.tsx) | Collapsible sidebar with role-based menu items, active state, icons |
| 3 | [topbar.tsx](file:///d:/Projects/LeaveLedger/src/components/layout/topbar.tsx) | User avatar, notifications bell, quick actions, breadcrumb |
| 4 | [dashboard layout](file:///d:/Projects/LeaveLedger/src/app/(dashboard)/layout.tsx) | Sidebar + topbar + content area, responsive |
| 5 | Auth middleware | Route protection, role-based redirects |

#### Phase 3: Core Leave Features
| # | File/Task | Description |
|---|-----------|-------------|
| 1 | **Dashboard** | Role-specific dashboard with stat cards, charts, quick actions |
| 2 | **Apply for Leave** | Multi-step form with date picker, leave type selector, validation |
| 3 | **Leave History** | Data table with filters, status badges, pagination |
| 4 | **Leave Balance** | Visual balance cards with progress rings |
| 5 | **Approval Queue** | Manager view with approve/reject actions, bulk operations |
| 6 | **Notifications** | In-app notification bell with dropdown |

#### Phase 4: Advanced Features
| # | File/Task | Description |
|---|-----------|-------------|
| 1 | **Team Calendar** | Month view with leave overlay, holiday markers |
| 2 | **Holiday Management** | CRUD for holidays, calendar view |
| 3 | **Reports & Analytics** | Charts, tables, CSV/PDF export |
| 4 | **User Management** | Employee directory, role assignment, department management |
| 5 | **Settings** | Leave policy configuration, system settings |
| 6 | **Profile** | User profile editing, password change |

#### Phase 5: Polish & Documentation
| # | File/Task | Description |
|---|-----------|-------------|
| 1 | Responsive design | Mobile-friendly sidebar, tables, forms |
| 2 | Dark/light mode | System preference + manual toggle |
| 3 | Micro-animations | Page transitions, hover effects, loading skeletons |
| 4 | Error handling | Error boundaries, toast notifications, form validation UX |
| 5 | README.md | Full README with screenshots, quick start, demo credentials |
| 6 | architecture.md | Data model diagram, auth flow, decision log |
| 7 | CI/CD | GitHub Actions workflow for lint + typecheck + test |
| 8 | CHANGELOG.md | Version history |

---

## Design System

### Color Palette
- **Primary**: Indigo-600 (`#4F46E5`) — professional, trustworthy
- **Secondary**: Violet-500 (`#8B5CF6`) — modern accent
- **Success**: Emerald-500 (`#10B981`) — approved states
- **Warning**: Amber-500 (`#F59E0B`) — pending states
- **Danger**: Rose-500 (`#F43F5E`) — rejected/error states
- **Background**: Slate-50 (light) / Slate-950 (dark)
- **Card surfaces**: White/Slate-900 with subtle borders

### Typography
- **Font**: Inter (Google Fonts) — clean, modern, professional
- **Headings**: Bold, tight tracking
- **Body**: Regular weight, comfortable line height

### UI Patterns
- Glassmorphism on login page and modal overlays
- Subtle gradient accents on primary actions
- Smooth transitions (200-300ms ease)
- Skeleton loaders during data fetch
- Toast notifications for actions
- Status badges with dot indicators
- Progress rings for balance visualization

---

## Database Seed Data

Pre-populated for demo:

| Entity | Data |
|--------|------|
| **Users** | 3 demo users (employee, manager, admin) with hashed passwords |
| **Departments** | Engineering, Product, Design, HR, Finance |
| **Leave Types** | Annual (20d), Sick (12d), Personal (5d), WFH (unlimited), Maternity (90d), Paternity (15d), Bereavement (5d), Comp Off (as earned) |
| **Leave Balances** | Pre-set for 2026 year |
| **Leave Requests** | 10-15 sample requests across various statuses |
| **Holidays** | 2026 public holidays (India) |
| **Notifications** | Sample notifications for each user |

---

## Verification Plan

### Automated Tests
```bash
npm run lint          # ESLint + strict TypeScript check
npm run typecheck     # tsc --noEmit
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright e2e tests
```

### Manual Verification
- Login with all 3 demo roles and verify role-specific dashboards
- Complete full leave request lifecycle: apply → approve/reject → view in history
- Verify leave balance calculations after approval
- Test team calendar visualization
- Test responsive design on mobile viewport
- Test dark/light mode toggle
- Verify all forms have proper Zod validation and error messages
- Test notification flow end-to-end

---

## Open Questions

> [!IMPORTANT]
> **Database Choice**: Should I use **SQLite** (simpler, zero-config, works locally without a database server) or **PostgreSQL via Neon/Supabase** (production-grade but requires connection string setup)? I recommend SQLite for fastest demo setup, with Prisma making it trivial to switch to PostgreSQL later.

> [!IMPORTANT]
> **Deployment**: Do you plan to deploy this to Vercel, or is this primarily for local development/demo? This affects whether I set up a managed database connection.

> [!NOTE]
> **Scope**: The plan above is comprehensive. Would you like me to implement everything, or start with a focused MVP (auth + dashboard + leave apply/approve + balance tracking) and iterate?
