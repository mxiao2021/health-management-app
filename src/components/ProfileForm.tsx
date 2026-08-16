"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ProfileValues = {
  age: string;
  gender: string;
  weightKg: string;
  heightCm: string;
  goal: string;
  conditions: string;
  exerciseHabit: string;
};

const EMPTY: ProfileValues = {
  age: "",
  gender: "",
  weightKg: "",
  heightCm: "",
  goal: "",
  conditions: "",
  exerciseHabit: "",
};

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900";

export default function ProfileForm({
  initial,
  submitLabel,
  regeneratePlan = false,
}: {
  initial?: ProfileValues;
  submitLabel: string;
  regeneratePlan?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileValues>(initial ?? EMPTY);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function update(field: keyof ProfileValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const profileResponse = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!profileResponse.ok) {
      const data = await profileResponse.json();
      setError(data.error ?? "Could not save profile");
      setPending(false);
      return;
    }

    const planResponse = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate: regeneratePlan }),
    });
    setPending(false);
    if (!planResponse.ok) {
      const data = await planResponse.json();
      setError(data.error ?? "Profile saved but the plan could not be generated");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Age
          <input
            name="age"
            type="number"
            min={10}
            max={110}
            required
            value={values.age}
            onChange={(e) => update("age", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Gender
          <select
            name="gender"
            required
            value={values.gender}
            onChange={(e) => update("gender", e.target.value)}
            className={inputClass}
          >
            <option value="">Select…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer not to say">Prefer not to say</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Weight (kg)
          <input
            name="weightKg"
            type="number"
            step="0.1"
            required
            value={values.weightKg}
            onChange={(e) => update("weightKg", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Height (cm)
          <input
            name="heightCm"
            type="number"
            step="0.1"
            required
            value={values.heightCm}
            onChange={(e) => update("heightCm", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Health goal
        <textarea
          name="goal"
          required
          rows={2}
          placeholder="I want to be fully physically functional in my 80s"
          value={values.goal}
          onChange={(e) => update("goal", e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Current health conditions
        <textarea
          name="conditions"
          rows={2}
          placeholder="e.g. mild hypertension, left knee pain — leave blank if none"
          value={values.conditions}
          onChange={(e) => update("conditions", e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Current exercise habit
        <textarea
          name="exerciseHabit"
          required
          rows={2}
          placeholder="e.g. walk 20 minutes most days, no strength training"
          value={values.exerciseHabit}
          onChange={(e) => update("exerciseHabit", e.target.value)}
          className={inputClass}
        />
      </label>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Building your plan…" : submitLabel}
      </button>
    </form>
  );
}
