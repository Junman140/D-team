import { notFound, redirect } from "next/navigation";
import { ContentSubnav } from "@/components/studio/content-subnav";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { saveHomepageSettings, savePolicy } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage settings | D-Team Production", robots: { index: false, follow: false } };

type HomepageSettings = { contactEmail?: string | null; contactPhone?: string | null; contactAddress?: string | null; availability?: string | null; intro?: string | null };
type PolicySettings = { approved?: boolean; body?: string; contactEmail?: string | null; retention?: string | null };

export default async function ContentHomepagePage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { content: ["read"] }))) notFound();
  const canUpdate = await hasStudioPermission(membership.organizationId, { content: ["update"] });

  const settings = await getPrisma().siteSetting.findMany({ where: { organizationId: membership.organizationId, key: { in: ["homepage", "privacy", "terms"] } } });
  const homepage = (settings.find((setting) => setting.key === "homepage")?.value ?? {}) as HomepageSettings;
  const privacy = (settings.find((setting) => setting.key === "privacy")?.value ?? { approved: false, body: "" }) as PolicySettings;
  const terms = (settings.find((setting) => setting.key === "terms")?.value ?? { approved: false, body: "" }) as PolicySettings;

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · WEBSITE</p>
      <h1 className="studio-page-title">The public<br /><em>front door.</em></h1>
      <p className="studio-page-intro">Contact details and policy wording only appear publicly when supplied. Privacy and terms content stays visibly pending until the owner approves the text.</p>
      <ContentSubnav />

      <section className="cms-panel">
        <span className="studio-empty-index">CONTACT & AVAILABILITY</span>
        <h2>Homepage details</h2>
        {canUpdate ? <form action={saveHomepageSettings} className="cms-form">
          <label>Contact email<input name="contactEmail" type="email" maxLength={254} defaultValue={homepage.contactEmail ?? ""} /></label>
          <label>Contact phone<input name="contactPhone" maxLength={80} defaultValue={homepage.contactPhone ?? ""} /></label>
          <label>Availability line<input name="availability" maxLength={160} defaultValue={homepage.availability ?? ""} placeholder="Available for select projects" /></label>
          <label>Contact address<input name="contactAddress" maxLength={300} defaultValue={homepage.contactAddress ?? ""} /></label>
          <label className="cms-wide">Intro line<textarea name="intro" maxLength={600} rows={3} defaultValue={homepage.intro ?? ""} /></label>
          <button type="submit">Save homepage details</button>
        </form> : <p>Read-only access.</p>}
      </section>

      {(["privacy", "terms"] as const).map((key) => {
        const policy = key === "privacy" ? privacy : terms;
        return <section className="cms-panel" key={key}>
          <span className="studio-empty-index">{key.toUpperCase()} POLICY</span>
          <h2>{key === "privacy" ? "Privacy notice" : "Terms"}</h2>
          <p className="cms-entry-meta">{policy.approved ? "Approved for public display." : "Pending owner approval. Public page shows a pending notice."}</p>
          {canUpdate ? <form action={savePolicy.bind(null, key)} className="cms-form">
            <label className="cms-wide">Policy body<textarea name="body" required minLength={20} maxLength={30000} rows={12} defaultValue={policy.body ?? ""} /></label>
            <label>Contact email<input name="contactEmail" type="email" maxLength={254} defaultValue={policy.contactEmail ?? homepage.contactEmail ?? ""} /></label>
            <label>Retention wording<textarea name="retention" maxLength={2000} rows={3} defaultValue={policy.retention ?? ""} /></label>
            <label className="cms-wide"><span><input name="approved" type="checkbox" value="yes" defaultChecked={policy.approved} /> I confirm this policy text is approved for publication.</span></label>
            <button type="submit">Save policy</button>
          </form> : <p>Read-only access.</p>}
        </section>;
      })}
    </>
  );
}
