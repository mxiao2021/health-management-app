"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewPanel({
  weekStart,
  hasReview,
}: {
  weekStart: string;
  hasReview: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setPending(true);
    setError("");
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, regenerate: hasReview }),
    });
    setPending(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Could not generate the review");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {pending
          ? "Reviewing your week…"
          : hasReview
            ? "Re-run review and rebuild next week"
            : "Run weekly review and build next week"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
