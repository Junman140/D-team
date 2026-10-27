import Link from "next/link";
import { SignOutButton } from "@/components/studio/sign-out-button";

export const metadata = {
  title: "Workspace access pending | D-Team Production",
  robots: { index: false, follow: false },
};

export default function StudioAccessPendingPage() {
  return (
    <main className="studio-auth-page">
      <Link className="studio-auth-wordmark" href="/studio">D—TEAM <span>PRODUCTION</span></Link>
      <section className="studio-auth-card">
        <p className="eyebrow">PRIVATE WORKSPACE · ACCESS PENDING</p>
        <h1>Not on the call sheet.</h1>
        <p>Your account is signed in, but it is not a member of the D-Team Production workspace. Ask the workspace owner to invite you.</p>
        <SignOutButton />
      </section>
    </main>
  );
}
