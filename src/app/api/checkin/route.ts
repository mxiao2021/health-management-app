import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  planDayId: z.string().min(1),
  exerciseDone: z.boolean().optional(),
  breakfastDone: z.boolean().optional(),
  lunchDone: z.boolean().optional(),
  dinnerDone: z.boolean().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { planDayId, ...updates } = parsed.data;

  const day = await prisma.planDay.findUnique({
    where: { id: planDayId },
    include: { plan: true, checkIn: true },
  });
  if (!day || day.plan.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const checkIn = await prisma.checkIn.upsert({
    where: { planDayId },
    create: { planDayId, ...updates },
    update: updates,
  });

  return NextResponse.json({
    exerciseDone: checkIn.exerciseDone,
    breakfastDone: checkIn.breakfastDone,
    lunchDone: checkIn.lunchDone,
    dinnerDone: checkIn.dinnerDone,
    note: checkIn.note,
  });
}
