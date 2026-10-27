"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      callbackURL: "/studio",
    });

    setIsSubmitting(false);
    if (result.error) {
      setError("Sign-in failed. Check your details or contact a D-Team administrator.");
      return;
    }

    router.replace("/studio");
    router.refresh();
  }

  return (
    <form className="studio-sign-in-form" onSubmit={handleSubmit}>
      <label htmlFor="staff-email">Work email</label>
      <input id="staff-email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="staff-password">Password</label>
      <input id="staff-password" name="password" type="password" autoComplete="current-password" minLength={12} required />
      {error && <p className="studio-form-error" role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in to Production"}</button>
      <p className="studio-sign-in-note">Staff accounts are created by an administrator. Public sign-up is disabled.</p>
    </form>
  );
}
