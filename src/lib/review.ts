import type { CheckIn, PlanDay, Profile, WeeklyPlan } from "@prisma/client";
import { generateJson } from "@/lib/llm";
import { MEALS } from "@/lib/plan";
import { DAY_NAMES, formatDate } from "@/lib/week";

export type PlanWithDays = WeeklyPlan & {
  days: Array<PlanDay & { checkIn: CheckIn | null }>;
};

export type ReviewDraft = {
  exerciseAdherence: number;
  dietAdherence: number;
  summary: string;
  adjustments: string;
  generatedBy: "llm" | "rule";
};

export function adherence(plan: PlanWithDays) {
  const days = plan.days.length || 1;
  const exercise = plan.days.filter((d) => d.checkIn?.exerciseDone).length / days;
  const mealsDone = plan.days.reduce(
    (total, d) =>
      total + MEALS.filter((meal) => d.checkIn?.[`${meal}Done`]).length,
    0,
  );
  return { exercise, diet: mealsDone / (days * MEALS.length) };
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function ruleBasedReview(plan: PlanWithDays): ReviewDraft {
  const { exercise, diet } = adherence(plan);
  const missedExercise = plan.days
    .filter((d) => !d.checkIn?.exerciseDone)
    .map((d) => DAY_NAMES[d.dayIndex]);

  const summary = `You completed ${pct(exercise)} of exercise sessions and ${pct(diet)} of planned meals.${
    missedExercise.length
      ? ` Missed workouts: ${missedExercise.join(", ")}.`
      : " A perfect week for training."
  }`;

  const adjustments =
    exercise < 0.5
      ? "Next week drops to shorter, easier sessions so the habit sticks; aim for consistency over intensity."
      : exercise < 0.8
        ? "Next week keeps a similar load but moves the hardest session to a day you reliably train."
        : "Next week adds a small progression in volume or intensity.";

  return {
    exerciseAdherence: exercise,
    dietAdherence: diet,
    summary,
    adjustments,
    generatedBy: "rule",
  };
}

const SYSTEM_PROMPT = `You are a supportive, evidence-based health coach writing a weekly review.
Return strict JSON: {"summary": string, "adjustments": string}.
"summary" is 2-4 sentences on how the week went, referencing the actual completion data and the user's long-term goal.
"adjustments" is 2-4 sentences of concrete changes for next week (volume, intensity, timing, and which meals to change).
Diet completion counts breakfast, lunch and dinner separately, so call out which meals are being missed.
Be encouraging but honest, never diagnose, and respect the user's stated conditions.`;

export async function buildReview(
  profile: Profile,
  plan: PlanWithDays,
): Promise<ReviewDraft> {
  const fallback = ruleBasedReview(plan);
  const log = plan.days
    .map(
      (d) =>
        `${DAY_NAMES[d.dayIndex]}: exercise "${d.exerciseTitle}" ${
          d.checkIn?.exerciseDone ? "done" : "missed"
        }; ${MEALS.map(
          (meal) =>
            `${meal} "${d[`${meal}Title`]}" ${
              d.checkIn?.[`${meal}Done`] ? "done" : "missed"
            }`,
        ).join("; ")}${d.checkIn?.note ? `; note: ${d.checkIn.note}` : ""}`,
    )
    .join("\n");

  const draft = await generateJson<{ summary?: unknown; adjustments?: unknown }>(
    SYSTEM_PROMPT,
    [
      `Week of ${formatDate(plan.weekStart)}.`,
      `Goal: ${profile.goal}`,
      `Age ${profile.age}, conditions: ${profile.conditions || "none reported"}, habit: ${profile.exerciseHabit}.`,
      `Exercise completion ${pct(fallback.exerciseAdherence)}, meal completion ${pct(fallback.dietAdherence)} (of 21 meals).`,
      "Daily log:",
      log,
    ].join("\n"),
  );

  if (typeof draft?.summary === "string" && typeof draft?.adjustments === "string") {
    return {
      exerciseAdherence: fallback.exerciseAdherence,
      dietAdherence: fallback.dietAdherence,
      summary: draft.summary,
      adjustments: draft.adjustments,
      generatedBy: "llm",
    };
  }
  return fallback;
}
