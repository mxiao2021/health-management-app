import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listWeeks } from "@/lib/service";
import { formatDate } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!user.profile) redirect("/onboarding");

  const weeks = await listWeeks(user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Your history</h1>
      <p className="mb-6 mt-2 text-slate-600">
        Every week you have planned, with what you completed.
      </p>

      {weeks.length === 0 ? (
        <p className="text-slate-600">No weeks yet.</p>
      ) : (
        <ul className="space-y-3">
          {weeks.map(({ plan, rates, review }) => (
            <li key={plan.id}>
              <Link
                href={`/history/${formatDate(plan.weekStart)}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-400"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-semibold text-slate-900">
                    Week of {formatDate(plan.weekStart)}
                  </h2>
                  <span className="text-sm text-slate-500">
                    Exercise {Math.round(rates.exercise * 100)}% · Meals{" "}
                    {Math.round(rates.diet * 100)}%
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{plan.summary}</p>
                {review ? (
                  <p className="mt-1 text-sm text-emerald-700">Reviewed</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
