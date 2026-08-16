# Health Coach

A weekly health-management web app: you describe yourself and your long-term
health goal, the coach writes a seven-day exercise and diet plan, you tick off
what you actually did, and every Sunday it reviews the week and adjusts the next
one. Everything is stored in a database so past weeks stay browsable.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + Postgres (Supabase in production)
- Anthropic Claude for plan and review generation, with a deterministic
  rule-based fallback when no API key is set

## Getting started

```bash
npm install
cp .env.example .env      # set DATABASE_URL/DIRECT_URL and ANTHROPIC_API_KEY
npx prisma migrate deploy
npm run dev               # http://localhost:3000
```

Without `ANTHROPIC_API_KEY` the app still works end to end — plans and reviews
come from the rule-based generator in `src/lib/plan.ts` and `src/lib/review.ts`,
and the UI labels which engine produced each plan.

## How it works

| Area | Where |
| --- | --- |
| Sign in (name + email, cookie session) | `src/app/api/auth`, `src/lib/session.ts` |
| Onboarding profile | `src/app/onboarding`, `src/app/api/profile` |
| Weekly plan generation | `src/lib/plan.ts`, `src/lib/service.ts`, `src/app/api/plan` |
| Daily check-ins | `src/components/DayCard.tsx`, `src/app/api/checkin` |
| Weekly review + next week | `src/lib/review.ts`, `src/app/api/review` |
| History of past weeks | `src/app/history` |

Weeks start on Monday (UTC). A review scores exercise and diet adherence,
writes a summary plus concrete adjustments, and immediately generates the next
week's plan using that feedback.

### Sunday automation

`POST /api/cron/weekly-review` runs the review for every user with a plan for
the current week. Protect it with `CRON_SECRET` and call it from any scheduler:

```bash
curl -X POST https://your-app/api/cron/weekly-review \
  -H "Authorization: Bearer $CRON_SECRET"
```

Users can also run the review from the dashboard at any time.

## Deployment (Vercel + Supabase)

Set these environment variables on the Vercel project:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler URI (port 6543, `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | Supabase direct/session URI (port 5432), used by `prisma migrate deploy` |
| `ANTHROPIC_API_KEY` | enables AI plans and reviews |
| `CRON_SECRET` | protects the weekly cron endpoint |

`npm run build` runs `prisma migrate deploy` first, so schema changes are applied
on every deployment. `vercel.json` schedules the Sunday review cron.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Note

Guidance is general wellness information, not medical advice.
