import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamMember } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const member = await getTeamMember(slug, { includeDrafts: process.env.NODE_ENV === "development" || await canPreviewContent() });
  return member ? { title: `${member.name} | D-Team Studio`, description: `${member.name} — ${member.role} at D-Team.` } : { title: "Team member not found | D-Team Studio" };
}

export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await getTeamMember(slug, { includeDrafts: process.env.NODE_ENV === "development" || await canPreviewContent() });
  if (!member) notFound();

  return (
    <main className="team-detail section-wrap" id="main-content">
      <Link className="text-link" href="/team">← The whole team</Link>
      <p className="eyebrow">D—TEAM STUDIO · {member.department || "TEAM"}</p>
      {member.status === "draft" && <span className="draft-tag">DRAFT PROFILE · PREVIEW ONLY FOR AUTHORIZED STAFF</span>}
      <div className="team-detail-grid">
        <div className="team-detail-portrait">
          {member.portraitUrl ? <img src={member.portraitUrl} alt={`Portrait of ${member.name}`} /> : <span aria-hidden="true">{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>}
        </div>
        <div>
          <h1>{member.name}<br /><em>{member.role}</em></h1>
          {member.bio ? <p className="team-detail-bio">{member.bio}</p> : <p className="asset-note">Approved bio pending.</p>}
        </div>
      </div>
    </main>
  );
}
