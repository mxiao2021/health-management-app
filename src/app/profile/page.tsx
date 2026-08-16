import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!user.profile) redirect("/onboarding");

  const { profile } = user;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>
      <p className="mb-6 mt-2 text-slate-600">
        Saving refreshes this week&apos;s plan with your updated details. Your
        check-ins for the week are kept.
      </p>
      <ProfileForm
        submitLabel="Save and refresh this week"
        regeneratePlan
        initial={{
          age: String(profile.age),
          gender: profile.gender,
          weightKg: String(profile.weightKg),
          heightCm: String(profile.heightCm),
          goal: profile.goal,
          conditions: profile.conditions,
          exerciseHabit: profile.exerciseHabit,
        }}
      />
    </div>
  );
}
