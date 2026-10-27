import { notFound, redirect } from "next/navigation";
import { ContentSubnav } from "@/components/studio/content-subnav";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { namedPortraitChoices } from "@/features/content/named-crew-roster";
import { createTeamMember, setTeamMemberPublication, updateTeamMember } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team content | D-Team Production", robots: { index: false, follow: false } };

export default async function ContentTeamPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { content: ["read"] }))) notFound();

  const [canCreate, canUpdate, canPublish] = await Promise.all([
    hasStudioPermission(membership.organizationId, { content: ["create"] }),
    hasStudioPermission(membership.organizationId, { content: ["update"] }),
    hasStudioPermission(membership.organizationId, { content: ["publish"] }),
  ]);
  const members = await getPrisma().teamMember.findMany({ where: { organizationId: membership.organizationId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · WEBSITE</p>
      <h1 className="studio-page-title">The people<br /><em>behind the work.</em></h1>
      <p className="studio-page-intro">Publish approved names, roles, portraits, and bios only. Saving an edit returns the profile to draft until it is published again.</p>
      <ContentSubnav />

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW TEAM MEMBER</span>
        <h2>Add a profile</h2>
        <form action={createTeamMember} className="cms-form">
          <label>Name<input name="name" required minLength={2} maxLength={120} /></label>
          <label>URL slug <span>(optional)</span><input name="slug" maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
          <label>Role<input name="role" required minLength={2} maxLength={120} /></label>
          <label>Department<input name="department" maxLength={120} /></label>
          <label>Sort order<input name="sortOrder" type="number" defaultValue={members.length} /></label>
          <label>Portrait from supplied photos<select name="portraitUrl" defaultValue=""><option value="">No portrait selected</option>{namedPortraitChoices.map((portrait) => <option value={portrait.path} key={portrait.path}>{portrait.label}</option>)}</select><span>Choose the named file that matches the person.</span></label>
          <label className="cms-wide">Bio<textarea name="bio" maxLength={4000} rows={5} /></label>
          <button type="submit">Save profile draft</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>TEAM PROFILES</span><span>{members.length} TOTAL · {members.filter((member) => member.status === "published").length} PUBLISHED</span></div>
      {members.length ? <div className="cms-entry-list">{members.map((member) => (
        <article className="cms-entry" key={member.id}>
          <header><div className="team-cms-identity">{member.portraitUrl && <img className="team-cms-portrait" src={member.portraitUrl} alt={`Portrait of ${member.name}`} loading="lazy" />}<div><span className={`cms-status${member.status === "published" ? " is-published" : ""}`}>{member.status}</span><h2>{member.name}</h2><p>{member.role}{member.department ? ` · ${member.department}` : ""} · /team/{member.slug}</p></div></div>
            <a href={`/team/${member.slug}`} target="_blank" rel="noreferrer">{member.status === "published" ? "View public page" : "Preview draft"} ↗</a>
          </header>
          {canUpdate ? <details><summary>Edit profile</summary>
            <form action={updateTeamMember.bind(null, member.id)} className="cms-form">
              <label>Name<input name="name" required minLength={2} maxLength={120} defaultValue={member.name} /></label>
              <label>URL slug<input name="slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={member.slug} /></label>
              <label>Role<input name="role" required minLength={2} maxLength={120} defaultValue={member.role} /></label>
              <label>Department<input name="department" maxLength={120} defaultValue={member.department ?? ""} /></label>
              <label>Sort order<input name="sortOrder" type="number" defaultValue={member.sortOrder} /></label>
              <label>Portrait from supplied photos<select name="portraitUrl" defaultValue={member.portraitUrl ?? ""}>{member.portraitUrl && !namedPortraitChoices.some((portrait) => portrait.path === member.portraitUrl) && <option value={member.portraitUrl}>Current portrait · keep existing</option>}<option value="">No portrait selected</option>{namedPortraitChoices.map((portrait) => <option value={portrait.path} key={portrait.path}>{portrait.label}</option>)}</select><span>Choose the named file that matches the person.</span></label>
              <label className="cms-wide">Bio<textarea name="bio" maxLength={4000} rows={5} defaultValue={member.bio ?? ""} /></label>
              <button type="submit">Save profile changes</button>
            </form>
          </details> : <p>Read-only access.</p>}
          {canPublish && <form action={setTeamMemberPublication.bind(null, member.id, member.status !== "published")} className="cms-publication-form">
            <button type="submit">{member.status === "published" ? "Unpublish" : "Publish"}</button>
          </form>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No team profiles yet.</h2><p>The homepage and team page keep their pending state until approved profiles are published.</p></div>}
    </>
  );
}
