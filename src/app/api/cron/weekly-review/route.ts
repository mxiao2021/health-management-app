import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureReview } from "@/lib/service";
import { weekStart } from "@/lib/week";

/**
 * Runs the weekly review for every user with a plan for the finishing week and
 * builds their next week. Intended to be called by a scheduler each Sunday.
 */
export const maxDuration = 300;

async function runWeeklyReview(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = weekStart();
  const plans = await prisma.weeklyPlan.findMany({
    where: { weekStart: week },
    select: { userId: true },
  });

  const results = await Promise.all(
    plans.map(async ({ userId }) => {
      try {
        await ensureReview(userId, week);
        return { userId, ok: true };
      } catch (error) {
        console.error(`Weekly review failed for ${userId}:`, error);
        return { userId, ok: false };
      }
    }),
  );

  return NextResponse.json({
    weekStart: week.toISOString(),
    reviewed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  });
}

export const POST = runWeeklyReview;

// Vercel Cron invokes scheduled jobs with GET and the CRON_SECRET bearer token.
export const GET = runWeeklyReview;
