import type { Metadata } from "next";
import Link from "next/link";
import { OnSetGrid } from "@/components/public/on-set-grid";
import { listTeamMembers } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { onSetImages } from "@/features/media/on-set-images";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team | D-Team Studio", description: "The people and crafts behind D-Team production." };

export default async function TeamPage() {
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const members = await listTeamMembers({ includeDrafts: preview, includeNamedPortraits: true });
  const roster = members;

  return (
    <main className="team-page section-wrap" id="main-content">
      <p className="eyebrow">D—TEAM STUDIO · TEAM</p>
      <h1 data-reveal="mask">One crew.<br /><em>Many crafts.</em></h1>
      <p className="team-page-intro">Meet the 30 people behind D-Team’s production work. Each photo is paired with the crew member named in the supplied image library.</p>
      {preview && <span className="draft-tag">PREVIEW · DRAFT CMS PROFILE CHANGES MAY APPEAR</span>}
      <section className="team-on-set" aria-labelledby="team-on-set-title">
        <div className="team-on-set-heading"><p className="eyebrow">THE CREW AT WORK</p><h2 id="team-on-set-title">Different crafts.<br /><em>Same set.</em></h2></div>
        <OnSetGrid images={onSetImages.slice(5)} limit={5} />
        <p className="asset-note">Photos of D-Team at work, paired with the named crew images supplied for this project.</p>
      </section>
      {roster.length > 0 ? <div className="public-team-grid">{roster.map((member) => (
        <article className="team-member-card" key={member.id}>
          <div className="team-member-portrait">
            {member.portraitUrl ? <img src={member.portraitUrl} alt={`D-Team crew member ${member.name}`} loading="lazy" /> : <span aria-hidden="true">{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>}
            {member.status === "draft" && <em className="draft-tag">DRAFT</em>}
          </div>
          <p className="eyebrow">{member.department || "D—TEAM"}</p>
          <h2>{member.id.startsWith("named-") ? <span>{member.name}</span> : <Link href={`/team/${member.slug}`}>{member.name}<span aria-hidden="true">↗</span></Link>}</h2>
          <p>{member.role}</p>
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>Team profiles are being prepared.</h2><p>Team details will appear here when added.</p></div>}
    </main>
  );
}
