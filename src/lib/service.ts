import { prisma } from "@/lib/prisma";
import { buildPlan, type PreviousWeekContext } from "@/lib/plan";
import { adherence, buildReview, type PlanWithDays } from "@/lib/review";
import { addDays, weekStart } from "@/lib/week";

const planInclude = {
  days: { include: { checkIn: true }, orderBy: { dayIndex: "asc" } },
} as const;

export async function getPlan(
  userId: string,
  week: Date,
): Promise<PlanWithDays | null> {
  return prisma.weeklyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart: week } },
    include: planInclude,
  });
}

async function previousWeekContext(
  userId: string,
  week: Date,
): Promise<PreviousWeekContext | undefined> {
  const previousStart = addDays(week, -7);
  const previous = await getPlan(userId, previousStart);
  if (!previous) return undefined;
  const rates = adherence(previous);
  const review = await prisma.weeklyReview.findUnique({
    where: { userId_weekStart: { userId, weekStart: previousStart } },
  });
  return {
    weekStart: previousStart,
    exerciseAdherence: rates.exercise,
    dietAdherence: rates.diet,
    reviewSummary: review?.summary,
    adjustments: review?.adjustments,
  };
}

/** Returns the plan for `week`, generating it first if it does not exist yet. */
export async function ensurePlan(
  userId: string,
  week: Date = weekStart(),
  options: { regenerate?: boolean } = {},
): Promise<PlanWithDays> {
  const existing = await getPlan(userId, week);
  if (existing && !options.regenerate) return existing;

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new Error("PROFILE_REQUIRED");

  const draft = await buildPlan(profile, week, await previousWeekContext(userId, week));

  // Regenerating rewrites the days in place so existing check-ins survive.
  if (existing) {
    return prisma.weeklyPlan.update({
      where: { id: existing.id },
      data: {
        summary: draft.summary,
        focus: draft.focus,
        generatedBy: draft.generatedBy,
        days: {
          upsert: draft.days.map((day) => {
            const content = {
              date: addDays(week, day.dayIndex),
              exerciseTitle: day.exerciseTitle,
              exerciseDetail: day.exerciseDetail,
              dietTitle: day.dietTitle,
              dietDetail: day.dietDetail,
            };
            return {
              where: { planId_dayIndex: { planId: existing.id, dayIndex: day.dayIndex } },
              create: { dayIndex: day.dayIndex, ...content },
              update: content,
            };
          }),
        },
      },
      include: planInclude,
    });
  }

  return prisma.weeklyPlan.create({
    data: {
      userId,
      weekStart: week,
      summary: draft.summary,
      focus: draft.focus,
      generatedBy: draft.generatedBy,
      days: {
        create: draft.days.map((day) => ({
          dayIndex: day.dayIndex,
          date: addDays(week, day.dayIndex),
          exerciseTitle: day.exerciseTitle,
          exerciseDetail: day.exerciseDetail,
          dietTitle: day.dietTitle,
          dietDetail: day.dietDetail,
        })),
      },
    },
    include: planInclude,
  });
}

/** Builds (or rebuilds) the review for `week` and pre-generates next week's plan. */
export async function ensureReview(
  userId: string,
  week: Date,
  options: { regenerate?: boolean } = {},
) {
  const existing = await prisma.weeklyReview.findUnique({
    where: { userId_weekStart: { userId, weekStart: week } },
  });
  if (existing && !options.regenerate) return existing;

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new Error("PROFILE_REQUIRED");
  const plan = await getPlan(userId, week);
  if (!plan) throw new Error("PLAN_REQUIRED");

  const draft = await buildReview(profile, plan);
  const data = {
    userId,
    weekStart: week,
    exerciseAdherence: draft.exerciseAdherence,
    dietAdherence: draft.dietAdherence,
    summary: draft.summary,
    adjustments: draft.adjustments,
    generatedBy: draft.generatedBy,
  };

  const review = await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId, weekStart: week } },
    create: data,
    update: data,
  });

  // The review drives next week's plan, so build it straight away.
  await ensurePlan(userId, addDays(week, 7), { regenerate: options.regenerate });

  return review;
}

export async function listWeeks(userId: string) {
  const [plans, reviews] = await Promise.all([
    prisma.weeklyPlan.findMany({
      where: { userId },
      include: planInclude,
      orderBy: { weekStart: "desc" },
    }),
    prisma.weeklyReview.findMany({ where: { userId } }),
  ]);

  return plans.map((plan) => ({
    plan,
    rates: adherence(plan),
    review:
      reviews.find((r) => r.weekStart.getTime() === plan.weekStart.getTime()) ?? null,
  }));
}
