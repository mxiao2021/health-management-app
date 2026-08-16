import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ProfileForm from "@/components/ProfileForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Tell us about you, {user.name}
      </h1>
      <p className="mb-6 mt-2 text-slate-600">
        This shapes your first week of exercise and diet guidance.
      </p>
      <ProfileForm submitLabel="Create my first week" />
    </div>
  );
}
