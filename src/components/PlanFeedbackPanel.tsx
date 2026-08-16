"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlanFeedbackPanel({
  weekStart,
  requests,
}: {
  weekStart: string;
  requests: string[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<"feedback" | "regenerate" | null>(null);
  const [error, setError] = useState("");

  async function submit(mode: "feedback" | "regenerate") {
    setPending(mode);
    setError("");
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:
        mode === "feedback"
          ? JSON.stringify({ weekStart, feedback: message.trim() })
          : JSON.stringify({ weekStart, regenerate: true }),
    });
    setPending(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not rebuild the plan");
      return;
    }
    if (mode === "feedback") setMessage("");
    router.refresh();
  }

  const busy = pending !== null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Want to change this plan?</h2>
      <p className="mt-1 text-sm text-slate-600">
        Tell the coach what to adjust — for example “I only want to play tennis on
        Friday, Saturday and Sunday” or “I don’t like salmon, use another protein”.
        Your ticked days are kept.
      </p>

      {requests.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {requests.map((request, index) => (
            <li
              key={index}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {request}
            </li>
          ))}
        </ul>
      ) : null}

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        maxLength={1000}
        disabled={busy}
        placeholder="What should be different this week?"
        className="mt-4 w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => submit("feedback")}
          disabled={busy || message.trim().length === 0}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {pending === "feedback" ? "Rebuilding your week…" : "Regenerate plan with my notes"}
        </button>
        <button
          type="button"
          onClick={() => submit("regenerate")}
          disabled={busy}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {pending === "regenerate" ? "Rebuilding your week…" : "Regenerate plan"}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">Takes about 30 seconds.</p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
