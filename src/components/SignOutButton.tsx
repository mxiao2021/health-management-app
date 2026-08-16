"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="text-slate-500 underline hover:text-slate-900"
      onClick={async () => {
        await fetch("/api/auth", { method: "DELETE" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
