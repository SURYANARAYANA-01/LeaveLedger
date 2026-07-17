# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-07-17

### Added
- Multi-tenant company registration — `/register` creates a new `Company` and its CEO account; every dashboard, directory, and approvals query is now scoped by `companyId`.
- Personal "My Leave" dashboard for Manager/HR roles, alongside their existing team/approval view.
- Role-scoped User Directory: Manager sees Employees, HR sees Manager + Employee, CEO sees everyone — grouped into labeled sections per role.
- Role-scoped Approvals Queue: Manager reviews Employees, HR reviews Manager + Employee, CEO reviews Manager + HR — with matching server-side permission enforcement on approve/reject.
- Interactive donut chart (Leave Request Distribution) with animated hover leader-lines, on HR/CEO and Manager dashboards.
- "Recent Team Requests" with inline quick-approve/reject on the HR/CEO dashboard, matching the Manager dashboard.
- CEO can now create/delete company holidays (previously HR-only).
- `docs/architecture.md` with full data model diagram, auth & invite flow, role permission matrix, API endpoint reference, and key trade-offs.

### Fixed
- Team Calendar and dashboard stat cards no longer leak data across companies (previously unscoped, showing every tenant's users/requests).
- "Active Employees" card now reflects the actual headcount visible to that role instead of a raw role-only count.
- "Pending Approvals" count now matches exactly what appears in the Approvals Queue (previously included the viewer's own self-submitted request).
- Seeded demo users no longer get their `joiningDate` reset to "today" on every reseed (was defaulting to `now()` with no explicit value).
- Removed a redundant full-page reload after adding/editing a user in the directory.
- Login/Register pages now respect the app's light/dark theme system instead of being hardcoded dark.
- Removed orphaned `src/not-found.tsx` (duplicate of the correct `src/app/not-found.tsx`).

### Changed
- Renamed `middleware.ts` → `proxy.ts` to resolve a Next.js build warning; route protection behavior is unchanged.
- Removed "HRistrator" wording from all user-facing text in favor of "HR".

## [1.0.0] - 2026-07-12

### Added
- Initial release: authentication (Employee / Manager / HR / CEO roles), leave request submission and approval workflow, leave balances, department and holiday management, dashboards per role.
