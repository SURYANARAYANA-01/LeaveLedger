# Contributing to LeaveLedger

Thanks for taking a look. Here's how to get set up and how changes are expected to land.

## Local setup

See the [README Quick Start](README.md#quick-start) for cloning, installing, and running the app. In short:

```bash
git clone https://github.com/SURYANARAYANA-01/LeaveLedger.git
cd LeaveLedger
cp .env.example .env      # fill in DATABASE_URL and AUTH_SECRET at minimum
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev               # http://localhost:3000
```

Demo accounts (password `demo1234`): `ceo@leaveledger.com`, `HR@leaveledger.com`, `manager@leaveledger.com`, `demo@leaveledger.com`.

## Branching

- Branch off `main`, one branch per feature or fix: `feature/short-description` or `fix/short-description`.
- Never commit directly to `main`.
- Rebase on `main` before opening a PR so conflicts are resolved on your branch, not in the merge queue.

## Commit style

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add CSV export for approvals queue
fix: correct joiningDate reset on reseed
docs: add architecture notes
refactor: extract donut chart into shared component
test: add unit tests for leave balance calculations
chore: bump next to 16.2.10
```

Keep commits small and scoped to one logical change. A reviewer should understand *why* from the subject line alone, without opening the diff. Avoid `fix`, `fix2`, `wip`, or `final-final` messages.

## Before opening a PR

Run all of these locally and make sure they pass:

```bash
npm run test          # Vitest unit tests
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript strict check
npm run build         # production build smoke-test
```

A PR with failing lint, type errors, broken tests, or a broken build won't be reviewed until those are green. CI will run all four automatically on push.

## Pull requests

Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`). In particular:

- Describe **what changed and why**, not just what files were touched.
- Link the schema/migration if your change touches `prisma/schema.prisma`.
- Attach screenshots for any UI change.

## Database changes

Always use a real migration — never `prisma db push` — so migration history stays accurate and reproducible:

```bash
npx prisma migrate dev --name your_migration_name
```

Include the generated migration file in your PR.
