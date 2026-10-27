import type { Metadata } from "next";
import { getSiteSetting } from "@/features/content/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Terms | D-Team Studio", robots: { index: false, follow: false } };

type PolicySettings = { approved?: boolean; body?: string; contactEmail?: string | null };

export default async function TermsPage() {
  const policy = await getSiteSetting<PolicySettings>("terms");
  return (
    <main className="policy-page section-wrap" id="main-content">
      <p className="eyebrow">D—TEAM STUDIO · TERMS</p>
      <h1>Terms of<br /><em>use.</em></h1>
      {policy?.approved && policy.body ? <>
        <div className="journal-body">{policy.body}</div>
        {policy.contactEmail && <p>Contact: <a href={`mailto:${policy.contactEmail}`}>{policy.contactEmail}</a></p>}
      </> : <div className="studio-empty-panel"><span className="draft-tag">PENDING OWNER APPROVAL</span><h2>The terms are being prepared.</h2><p>Approved terms will be published here before the site goes live.</p></div>}
    </main>
  );
}
