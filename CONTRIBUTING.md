# Contributing to LeaveLedger

Thanks for taking a look. Here's how to get set up and how changes are expected to land.

## Local setup

See the [README Quick Start](README.md#quick-start) for cloning, installing, and running the app. In short:

```bash
git clone https://github.com/SURYANARAYANA-01/LeaveLedger.git
cd LeaveLedger
cp .env.example .env      # fill in DATABASE_URL and AUTH_SECRET
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

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
```

Keep commits small and scoped to one logical change — a reviewer should be able to understand *why* from the message alone, without opening the diff.

## Before opening a PR

```bash
npm run lint        # ESLint
npx tsc --noEmit     # TypeScript strict check
npm run build        # confirm it actually builds for production
```

A PR with failing lint, type errors, or a broken build won't be reviewed until those are green.

## Pull requests

- Describe **what changed and why**, not just what files touched.
- Link the schema/migration if your change touches `prisma/schema.prisma`.
- Screenshots for any UI change.

## Database changes

Always use a real migration, never `prisma db push`, so migration history stays accurate:

```bash
npx prisma migrate dev --name your_migration_name
```
