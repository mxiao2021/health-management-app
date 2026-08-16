import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE = "hc_user";

export async function getCurrentUser() {
  const store = await cookies();
  const userId = store.get(COOKIE)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function setSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
