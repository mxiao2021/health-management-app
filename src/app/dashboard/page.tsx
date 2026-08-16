import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ensurePlan } from "@/lib/service";
import { adherence } from "@/lib/review";
import { dayIndexOf, formatDate, isSunday, weekStart } from "@/lib/week";
import { toDayCardData } from "@/lib/dayCard";
import DayCard from "@/components/DayCard";
import ReviewPanel from "@/components/ReviewPanel";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!user.profile) redirect("/onboarding");

  const week = weekStart();
  const plan = await ensurePlan(user.id, week);
  const review = await prisma.weeklyReview.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart: week } },
  });
  const rates = adherence(plan);
  const today = dayIndexOf();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Week of {formatDate(plan.weekStart)}
          </h1>
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {plan.generatedBy === "llm" ? "AI-generated plan" : "Rule-based plan"}
          </span>
        </div>
        <p className="mt-2 text-slate-600">{plan.summary}</p>
        <p className="mt-1 text-sm font-medium text-emerald-700">Focus: {plan.focus}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Exercise completed</dt>
            <dd className="text-lg font-semibold text-slate-900">
              {Math.round(rates.exercise * 100)}%
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Meals followed</dt>
            <dd className="text-lg font-semibold text-slate-900">
              {Math.round(rates.diet * 100)}%
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {plan.days.map((day) => (
          <DayCard
            key={day.id}
            isToday={day.dayIndex === today}
            day={toDayCardData(day)}
          />
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Weekly review</h2>
        {review ? (
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            <p>{review.summary}</p>
            <p>
              <span className="font-medium text-slate-800">Next week: </span>
              {review.adjustments}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            {isSunday()
              ? "It's Sunday — run your review to see how the week went and get next week's adjusted plan."
              : "Your review unlocks on Sunday, but you can run it early at any time."}
          </p>
        )}
        <div className="mt-4">
          <ReviewPanel
            weekStart={formatDate(plan.weekStart)}
            hasReview={Boolean(review)}
          />
        </div>
      </section>
    </div>
  );
}
