import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { ensureReview } from "@/lib/service";
import { weekStart } from "@/lib/week";

const schema = z.object({
  weekStart: z.string().optional(),
  regenerate: z.boolean().optional(),
});

export const maxDuration = 300;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const week = weekStart(
    parsed.data.weekStart ? new Date(parsed.data.weekStart) : new Date(),
  );

  try {
    const review = await ensureReview(user.id, week, {
      regenerate: parsed.data.regenerate,
    });
    return NextResponse.json({ reviewId: review.id, generatedBy: review.generatedBy });
  } catch (error) {
    if (error instanceof Error && error.message === "PLAN_REQUIRED") {
      return NextResponse.json(
        { error: "No plan exists for that week yet" },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "PROFILE_REQUIRED") {
      return NextResponse.json({ error: "Complete your profile first" }, { status: 400 });
    }
    throw error;
  }
}
