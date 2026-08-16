# Health Coach

A weekly health-management web app: you describe yourself and your long-term
health goal, the coach writes a seven-day exercise and diet plan, you tick off
what you actually did, and every Sunday it reviews the week and adjusts the next
one. Everything is stored in a database so past weeks stay browsable.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- Anthropic Claude for plan and review generation, with a deterministic
  rule-based fallback when no API key is set

## Getting started

```bash
npm install
cp .env.example .env      # set ANTHROPIC_API_KEY to enable AI plans
npx prisma migrate dev
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

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Note

Guidance is general wellness information, not medical advice.
