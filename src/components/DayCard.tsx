"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type MealKey = "breakfast" | "lunch" | "dinner";

export type DayCardData = {
  id: string;
  dayName: string;
  date: string;
  exerciseTitle: string;
  exerciseDetail: string;
  exerciseDone: boolean;
  meals: Array<{
    key: MealKey;
    label: string;
    title: string;
    detail: string;
    done: boolean;
  }>;
  note: string;
};

export default function DayCard({
  day,
  isToday,
  readOnly = false,
}: {
  day: DayCardData;
  isToday?: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [exerciseDone, setExerciseDone] = useState(day.exerciseDone);
  const [meals, setMeals] = useState(() =>
    Object.fromEntries(day.meals.map((meal) => [meal.key, meal.done])) as Record<
      MealKey,
      boolean
    >,
  );
  const [note, setNote] = useState(day.note);
  const [, startTransition] = useTransition();

  async function save(updates: {
    exerciseDone?: boolean;
    breakfastDone?: boolean;
    lunchDone?: boolean;
    dinnerDone?: boolean;
    note?: string;
  }) {
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planDayId: day.id, ...updates }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        isToday ? "border-emerald-500 ring-1 ring-emerald-200" : "border-slate-200"
      }`}
    >
      <header className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-900">
          {day.dayName}
          {isToday ? (
            <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Today
            </span>
          ) : null}
        </h3>
        <span className="text-xs text-slate-400">{day.date}</span>
      </header>

      <div className="mt-3 space-y-3 text-sm">
        <div>
          <p className="font-medium text-slate-800">Exercise · {day.exerciseTitle}</p>
          <p className="text-slate-600">{day.exerciseDetail}</p>
          <label className="mt-1 inline-flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              aria-label={`${day.dayName} exercise complete`}
              checked={exerciseDone}
              disabled={readOnly}
              onChange={(e) => {
                setExerciseDone(e.target.checked);
                void save({ exerciseDone: e.target.checked });
              }}
              className="h-4 w-4"
            />
            Completed
          </label>
        </div>

        {day.meals.map((meal) => (
          <div key={meal.key}>
            <p className="font-medium text-slate-800">
              {meal.label} · {meal.title}
            </p>
            <p className="text-slate-600">{meal.detail}</p>
            <label className="mt-1 inline-flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                aria-label={`${day.dayName} ${meal.label.toLowerCase()} complete`}
                checked={meals[meal.key]}
                disabled={readOnly}
                onChange={(e) => {
                  const done = e.target.checked;
                  setMeals((prev) => ({ ...prev, [meal.key]: done }));
                  void save({ [`${meal.key}Done`]: done });
                }}
                className="h-4 w-4"
              />
              Followed
            </label>
          </div>
        ))}

        {readOnly ? (
          note ? <p className="text-slate-500">Note: {note}</p> : null
        ) : (
          <input
            type="text"
            aria-label={`${day.dayName} note`}
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => void save({ note })}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-slate-900"
          />
        )}
      </div>
    </article>
  );
}
