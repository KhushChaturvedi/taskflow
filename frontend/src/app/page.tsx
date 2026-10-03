"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loginWithGoogle } from "@/lib/api";
import { getToken, saveSession } from "@/lib/auth";

const features = [
  "Create tasks with due dates",
  "Assign work to anyone on the team",
  "Get email updates when tasks move",
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  async function handleSuccess(credential?: string) {
    if (!credential) {
      setError("Google did not return a credential. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { token, user } = await loginWithGoogle(credential);
      saveSession(token, user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-indigo-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            ✓
          </span>
          TaskFlow
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Plan the work.
            <br />
            Share the load.
          </h1>
          <p className="mt-4 max-w-md text-indigo-100">
            Create tasks, hand them off to teammates, and get an email the
            moment something changes.
          </p>
          <ul className="mt-10 space-y-4 text-indigo-50">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-indigo-200">
          Built with Next.js, Flask and Supabase
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold text-indigo-600 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              ✓
            </span>
            TaskFlow
          </div>

          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with your Google account to see your tasks.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(res) => handleSuccess(res.credential)}
                onError={() =>
                  setError("Google sign-in failed. Please try again.")
                }
                theme="outline"
                size="large"
                text="continue_with"
                shape="pill"
              />
            </div>

            {loading && (
              <p className="mt-4 text-center text-sm text-slate-500">
                Signing you in...
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            New here? Signing in creates your account automatically.
          </p>
        </div>
      </section>
    </main>
  );
}
