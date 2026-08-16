import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import SignInForm from "@/components/SignInForm";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.profile) redirect("/dashboard");
  if (user) redirect("/onboarding");

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h1 className="text-3xl font-semibold text-slate-900">
          A weekly plan that adapts to your life
        </h1>
        <p className="mt-4 text-slate-600">
          Tell Health Coach about yourself and your long-term goal. You get a
          seven-day exercise and diet plan, tick off what you actually did, and
          every Sunday the coach reviews the week and adjusts the next one.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-slate-600">
          <li>• Personalised weekly exercise and diet guidance</li>
          <li>• Daily check-ins for exercise and diet</li>
          <li>• Sunday review with concrete adjustments</li>
          <li>• Full history of previous weeks</li>
        </ul>
      </section>
      <SignInForm />
    </div>
  );
}
