import type { Metadata } from "next";
import { SignInForm } from "@/components/studio/sign-in-form";

export const metadata: Metadata = {
  title: "Staff sign-in | D-Team Production",
  robots: { index: false, follow: false },
};

export default function StudioSignInPage() {
  return (
    <main className="studio-auth-page" id="main-content">
      <a className="studio-auth-wordmark" href="/">D—TEAM<span>PRODUCTION</span></a>
      <div className="studio-auth-card">
        <p className="eyebrow">PRIVATE WORKSPACE · STAFF ACCESS</p>
        <h1>Welcome<br /><em>to the set.</em></h1>
        <p>Sign in to manage the work behind the work.</p>
        <SignInForm />
      </div>
    </main>
  );
}
