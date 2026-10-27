import type { Metadata } from "next";
import { getSiteSetting } from "@/features/content/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privacy | D-Team Studio", robots: { index: false, follow: false } };

type PolicySettings = { approved?: boolean; body?: string; contactEmail?: string | null; retention?: string | null };

export default async function PrivacyPage() {
  const policy = await getSiteSetting<PolicySettings>("privacy");
  return (
    <main className="policy-page section-wrap" id="main-content">
      <p className="eyebrow">D—TEAM STUDIO · PRIVACY</p>
      <h1>Privacy<br /><em>notice.</em></h1>
      {policy?.approved && policy.body ? <>
        <div className="journal-body">{policy.body}</div>
        {policy.retention && <p><strong>Retention:</strong> {policy.retention}</p>}
        {policy.contactEmail && <p>Privacy contact: <a href={`mailto:${policy.contactEmail}`}>{policy.contactEmail}</a></p>}
      </> : <div className="studio-empty-panel"><span className="draft-tag">PENDING OWNER APPROVAL</span><h2>The privacy notice is being prepared.</h2><p>Project inquiry collection stays paused until this notice, the contact route, and the retention wording are approved.</p></div>}
    </main>
  );
}
