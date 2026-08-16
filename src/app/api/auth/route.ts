import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clearSession, setSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name or email" }, { status: 400 });
  }
  const { email, name } = parsed.data;
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), name },
    update: { name },
    include: { profile: true },
  });
  await setSession(user.id);
  return NextResponse.json({ id: user.id, hasProfile: Boolean(user.profile) });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
