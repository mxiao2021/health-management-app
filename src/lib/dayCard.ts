import type { CheckIn, PlanDay } from "@prisma/client";
import type { DayCardData } from "@/components/DayCard";
import { DAY_NAMES, formatDate } from "@/lib/week";

const MEAL_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
} as const;

export function toDayCardData(
  day: PlanDay & { checkIn: CheckIn | null },
): DayCardData {
  return {
    id: day.id,
    dayName: DAY_NAMES[day.dayIndex],
    date: formatDate(day.date),
    exerciseTitle: day.exerciseTitle,
    exerciseDetail: day.exerciseDetail,
    exerciseDone: day.checkIn?.exerciseDone ?? false,
    meals: [
      {
        key: "breakfast",
        label: MEAL_LABELS.breakfast,
        title: day.breakfastTitle,
        detail: day.breakfastDetail,
        done: day.checkIn?.breakfastDone ?? false,
      },
      {
        key: "lunch",
        label: MEAL_LABELS.lunch,
        title: day.lunchTitle,
        detail: day.lunchDetail,
        done: day.checkIn?.lunchDone ?? false,
      },
      {
        key: "dinner",
        label: MEAL_LABELS.dinner,
        title: day.dinnerTitle,
        detail: day.dinnerDetail,
        done: day.checkIn?.dinnerDone ?? false,
      },
    ],
    note: day.checkIn?.note ?? "",
  };
}
