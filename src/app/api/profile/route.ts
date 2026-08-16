import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  age: z.coerce.number().int().min(10).max(110),
  gender: z.string().min(1).max(40),
  weightKg: z.coerce.number().min(20).max(400),
  heightCm: z.coerce.number().min(80).max(250),
  goal: z.string().min(3).max(500),
  conditions: z.string().max(1000).default(""),
  exerciseHabit: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile" },
      { status: 400 },
    );
  }

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
