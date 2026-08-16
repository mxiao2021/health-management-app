import type { Profile } from "@prisma/client";
import { generateJson } from "@/lib/llm";
import { DAY_NAMES, formatDate } from "@/lib/week";

export type PlanDayDraft = {
  dayIndex: number;
  exerciseTitle: string;
  exerciseDetail: string;
  breakfastTitle: string;
  breakfastDetail: string;
  lunchTitle: string;
  lunchDetail: string;
  dinnerTitle: string;
  dinnerDetail: string;
};

export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export type Meal = (typeof MEALS)[number];

export type PlanDraft = {
  summary: string;
  focus: string;
  days: PlanDayDraft[];
  generatedBy: "llm" | "rule";
};

export type PreviousWeekContext = {
  weekStart: Date;
  exerciseAdherence: number;
  dietAdherence: number;
  reviewSummary?: string;
  adjustments?: string;
};

function bmi(profile: Profile): number {
  const meters = profile.heightCm / 100;
  return profile.weightKg / (meters * meters);
}

function intensityLevel(profile: Profile): "gentle" | "moderate" | "vigorous" {
  const habit = profile.exerciseHabit.toLowerCase();
  const sedentary =
    habit.includes("none") ||
    habit.includes("rare") ||
    habit.includes("sedentary") ||
    habit.includes("never");
  if (sedentary || profile.age >= 70 || bmi(profile) >= 32) return "gentle";
  if (habit.includes("daily") || habit.includes("5") || habit.includes("6"))
    return "vigorous";
  return "moderate";
}

const EXERCISE_TEMPLATES: Record<
  "gentle" | "moderate" | "vigorous",
  Array<[string, string]>
> = {
  gentle: [
    ["Walk + mobility", "20 min easy walk, then 10 min ankle/hip/shoulder mobility."],
    ["Chair strength", "2 rounds: 10 sit-to-stands, 10 wall push-ups, 10 heel raises."],
    ["Balance & core", "3 x 30 s single-leg stand each side, 3 x 20 s dead bug hold."],
    ["Walk", "25 min walk at a pace where you can still talk."],
    ["Full-body strength", "2 rounds: 10 band rows, 10 glute bridges, 10 bird dogs each side."],
    ["Active recovery", "15 min gentle stretching or restorative yoga."],
    ["Rest & plan", "Rest day. Do a 10 min walk and review the week."],
  ],
  moderate: [
    ["Lower-body strength", "3 x 10 goblet squats, 3 x 10 split squats, 3 x 12 calf raises."],
    ["Zone 2 cardio", "35 min brisk walk, cycle, or jog at conversational pace."],
    ["Upper-body strength", "3 x 8 push-ups, 3 x 10 rows, 3 x 12 shoulder presses."],
    ["Mobility & core", "20 min mobility flow, 3 x 40 s plank, 3 x 12 side planks."],
    ["Intervals", "6 x 1 min hard / 2 min easy on bike, rower, or hills."],
    ["Long easy effort", "50-60 min hike, walk, or easy ride."],
    ["Rest & plan", "Rest or 20 min stretching. Review the week."],
  ],
  vigorous: [
    ["Heavy lower body", "4 x 6 squats, 3 x 8 Romanian deadlifts, 3 x 12 lunges."],
    ["Threshold cardio", "10 min warm-up, 20 min at threshold, 10 min cool-down."],
    ["Heavy upper body", "4 x 6 bench or push-ups, 4 x 8 pull-ups or rows, 3 x 12 face pulls."],
    ["Mobility & core", "25 min mobility, 4 x 45 s plank variations, 3 x 15 hanging knee raises."],
    ["VO2 intervals", "5 x 3 min hard / 3 min easy."],
    ["Long endurance", "75-90 min run, ride, or hike."],
    ["Rest & plan", "Full rest or light walk. Review the week."],
  ],
};

type MealTemplate = {
  breakfast: [string, string];
  lunch: [string, string];
  dinner: [string, string];
};

const DIET_TEMPLATES: MealTemplate[] = [
  {
    breakfast: ["Protein oats", "Oats with milk or soy milk, a scoop of yoghurt, berries and a spoon of nut butter. Aim for 25-30 g protein."],
    lunch: ["Grain bowl", "Whole grains, a palm of chicken, tofu or fish, and two fistfuls of vegetables with olive oil."],
    dinner: ["Fish and greens", "Baked fish or lentils, roasted vegetables, small portion of potato or rice. Stop eating 2 h before bed."],
  },
  {
    breakfast: ["Eggs and greens", "Two eggs or a tofu scramble with spinach and a slice of wholegrain bread."],
    lunch: ["Bean salad", "Beans or lentils, mixed leaves, tomato, cucumber, feta or seeds, olive-oil dressing."],
    dinner: ["Stir-fry", "Lean protein with plenty of mixed vegetables and brown rice; go easy on the sauce."],
  },
  {
    breakfast: ["Yoghurt and fruit", "Greek yoghurt, a piece of fruit and a small handful of nuts."],
    lunch: ["Soup and sandwich", "Vegetable soup plus a wholegrain sandwich with a protein filling."],
    dinner: ["Chicken and vegetables", "Palm of chicken or a plant protein, half a plate of vegetables, quarter plate of whole grains."],
  },
  {
    breakfast: ["Smoothie", "Milk or soy milk, banana, berries, oats and a protein source; drink alongside a glass of water."],
    lunch: ["Leftovers, balanced", "Yesterday's dinner plus an extra serving of salad or vegetables."],
    dinner: ["Lentil stew", "Lentil or bean stew with vegetables and a small serving of wholegrain bread."],
  },
  {
    breakfast: ["Wholegrain toast", "Wholegrain toast with avocado or cottage cheese and a piece of fruit."],
    lunch: ["Salad with protein", "Big mixed salad with eggs, tuna, chickpeas or chicken and an olive-oil dressing."],
    dinner: ["Home-cooked plate", "Home-cooked meal, no sugary drinks, salt under 5 g for the day."],
  },
  {
    breakfast: ["Relaxed breakfast", "Whatever you enjoy, but include a protein source and a piece of fruit."],
    lunch: ["Balanced plate", "Half vegetables, quarter protein, quarter whole-grain carbs."],
    dinner: ["Planned treat", "Balanced dinner plus one planned treat you actually enjoy, eaten slowly."],
  },
  {
    breakfast: ["Simple start", "Eggs or yoghurt with fruit while you plan the week's shopping."],
    lunch: ["Prep-and-eat", "Eat a balanced plate from what you batch-cook today."],
    dinner: ["Batch-cook", "Cook protein and vegetables for the next 3 days; portion them out tonight."],
  },
];

export function ruleBasedPlan(
  profile: Profile,
  previous?: PreviousWeekContext,
): PlanDraft {
  const level = intensityLevel(profile);
  const exercises = EXERCISE_TEMPLATES[level];
  const shift =
    previous && previous.exerciseAdherence < 0.6
      ? "Volume kept light because last week's completion was under 60%."
      : previous && previous.exerciseAdherence >= 0.9
        ? "Slight progression added because last week was nearly perfect."
        : "Steady, sustainable progression.";

  return {
    summary: `A ${level} week built around your goal: ${profile.goal}. ${shift}`,
    focus: level === "gentle" ? "Consistency and mobility" : level === "moderate" ? "Strength and aerobic base" : "Progressive overload and conditioning",
    generatedBy: "rule",
    days: DAY_NAMES.map((_, dayIndex) => ({
      dayIndex,
      exerciseTitle: exercises[dayIndex][0],
      exerciseDetail: exercises[dayIndex][1],
      breakfastTitle: DIET_TEMPLATES[dayIndex].breakfast[0],
      breakfastDetail: DIET_TEMPLATES[dayIndex].breakfast[1],
      lunchTitle: DIET_TEMPLATES[dayIndex].lunch[0],
      lunchDetail: DIET_TEMPLATES[dayIndex].lunch[1],
      dinnerTitle: DIET_TEMPLATES[dayIndex].dinner[0],
      dinnerDetail: DIET_TEMPLATES[dayIndex].dinner[1],
    })),
  };
}

const SYSTEM_PROMPT = `You are a cautious, evidence-based health coach who writes weekly exercise and diet plans.
Return strict JSON: {"summary": string, "focus": string, "days": [{"dayIndex": 0-6, "exerciseTitle": string, "exerciseDetail": string, "breakfastTitle": string, "breakfastDetail": string, "lunchTitle": string, "lunchDetail": string, "dinnerTitle": string, "dinnerDetail": string}]}.
Include exactly 7 days, dayIndex 0 = Monday through 6 = Sunday. Every day must have all three meals: breakfast, lunch and dinner.
Titles under 40 characters and name the dish. Details 1-2 sentences and concrete (sets, reps, durations, foods, portions).
Vary the meals across the week and keep them realistic to cook.
Respect the user's stated medical conditions, scale intensity to their current habits and age, and include at least one rest or recovery day.
Never diagnose, never prescribe medication, and add safety caveats inside the detail text when relevant.`;

function profilePrompt(
  profile: Profile,
  weekStartDate: Date,
  previous?: PreviousWeekContext,
): string {
  const lines = [
    `Week starting: ${formatDate(weekStartDate)} (Monday).`,
    `Age: ${profile.age}, gender: ${profile.gender}.`,
    `Weight: ${profile.weightKg} kg, height: ${profile.heightCm} cm (BMI ${bmi(profile).toFixed(1)}).`,
    `Long-term health goal: ${profile.goal}`,
    `Current health conditions: ${profile.conditions || "none reported"}`,
    `Current exercise habit: ${profile.exerciseHabit}`,
  ];
  if (previous) {
    lines.push(
      `Last week (${formatDate(previous.weekStart)}): exercise completion ${Math.round(previous.exerciseAdherence * 100)}%, diet completion ${Math.round(previous.dietAdherence * 100)}%.`,
    );
    if (previous.reviewSummary) lines.push(`Last week's review: ${previous.reviewSummary}`);
    if (previous.adjustments) lines.push(`Planned adjustments: ${previous.adjustments}`);
  }
  return lines.join("\n");
}

function isValidDraft(value: unknown): value is Omit<PlanDraft, "generatedBy"> {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<PlanDraft>;
  if (typeof draft.summary !== "string" || typeof draft.focus !== "string") return false;
  if (!Array.isArray(draft.days) || draft.days.length !== 7) return false;
  return draft.days.every(
    (day) =>
      typeof day?.dayIndex === "number" &&
      day.dayIndex >= 0 &&
      day.dayIndex <= 6 &&
      typeof day.exerciseTitle === "string" &&
      typeof day.exerciseDetail === "string" &&
      MEALS.every(
        (meal) =>
          typeof day[`${meal}Title`] === "string" &&
          typeof day[`${meal}Detail`] === "string",
      ),
  );
}

export async function buildPlan(
  profile: Profile,
  weekStartDate: Date,
  previous?: PreviousWeekContext,
): Promise<PlanDraft> {
  const draft = await generateJson<unknown>(
    SYSTEM_PROMPT,
    profilePrompt(profile, weekStartDate, previous),
  );
  if (isValidDraft(draft)) {
    return {
      summary: draft.summary,
      focus: draft.focus,
      days: [...draft.days].sort((a, b) => a.dayIndex - b.dayIndex),
      generatedBy: "llm",
    };
  }
  return ruleBasedPlan(profile, previous);
}
