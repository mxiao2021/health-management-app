import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import SignOutButton from "@/components/SignOutButton";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Health Coach",
  description: "Weekly exercise and diet plans that adapt to how your week went.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold text-emerald-700">
              Health Coach
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                  This week
                </Link>
                <Link href="/history" className="text-slate-600 hover:text-slate-900">
                  History
                </Link>
                <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                  Profile
                </Link>
                <span className="ml-auto text-slate-500">{user.name}</span>
                <SignOutButton />
              </>
            ) : null}
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
