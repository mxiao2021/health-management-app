import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/service";
import { adherence } from "@/lib/review";
import { formatDate, weekStart } from "@/lib/week";
import { toDayCardData } from "@/lib/dayCard";
import DayCard from "@/components/DayCard";

export const dynamic = "force-dynamic";

export default async function WeekDetailPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { week: weekParam } = await params;
  const parsed = new Date(`${weekParam}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) notFound();

  const week = weekStart(parsed);
  const plan = await getPlan(user.id, week);
  if (!plan) notFound();

  const review = await prisma.weeklyReview.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart: week } },
  });
  const rates = adherence(plan);
  const isCurrentWeek = week.getTime() === weekStart().getTime();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/history" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to history
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Week of {formatDate(plan.weekStart)}
        </h1>
        <p className="mt-2 text-slate-600">{plan.summary}</p>
        <p className="mt-1 text-sm text-slate-500">
          Exercise {Math.round(rates.exercise * 100)}% · Meals{" "}
          {Math.round(rates.diet * 100)}%
        </p>
      </div>

      {review ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Review</h2>
          <p className="mt-2 text-sm text-slate-600">{review.summary}</p>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">Adjustments: </span>
            {review.adjustments}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {plan.days.map((day) => (
          <DayCard
            key={day.id}
            readOnly={!isCurrentWeek}
            day={toDayCardData(day)}
          />
        ))}
      </section>
    </div>
  );
}
