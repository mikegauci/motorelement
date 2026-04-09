"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/account");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4">
      <div className="w-full max-w-md bg-obsidian border border-border p-8">
        <h1 className="text-center font-heading text-4xl text-white mb-8">
          MOTOR ELEMENT
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block font-sub font-bold uppercase tracking-widest text-label text-muted mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-carbon border border-border rounded-none p-3 text-white font-body text-sm placeholder:text-muted focus:outline-none focus:border-ignition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-sub font-bold uppercase tracking-widest text-label text-muted mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="w-full bg-carbon border border-border rounded-none p-3 text-white font-body text-sm placeholder:text-muted focus:outline-none focus:border-ignition"
            />
          </div>

          {error && (
            <p className="text-redline font-body text-sm">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </Button>
        </form>

        {/* TODO: sign-up flow in a future phase */}
        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <span className="cursor-pointer text-muted transition-colors hover:text-white">
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
