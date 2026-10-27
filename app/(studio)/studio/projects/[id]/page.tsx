import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDate, formatDateTime, formatMoney, toDateTimeLocal } from "@/lib/format";
import { addProjectMember, createMilestone, deleteMilestone, removeProjectMember, setMilestoneStatus, updateProject } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Project | D-Team Production", robots: { index: false, follow: false } };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { project: ["read"] }))) notFound();

  const prisma = getPrisma();
  const project = await prisma.project.findFirst({
    where: { id, organizationId: membership.organizationId },
    include: {
      client: true,
      service: true,
      lead: { select: { id: true, name: true } },
      members: { include: { crewProfile: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } },
      milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      scheduleItems: { orderBy: { startsAt: "asc" } },
      quotes: { include: { lineItems: true }, orderBy: { createdAt: "desc" } },
      deliverables: { orderBy: { createdAt: "asc" } },
      mediaAssets: { orderBy: { createdAt: "desc" }, take: 12 },
      galleries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  const [canUpdate, canAssign] = await Promise.all([
    hasStudioPermission(membership.organizationId, { project: ["update"] }),
    hasStudioPermission(membership.organizationId, { project: ["assign"] }),
  ]);
  const [clients, services, members, crewProfiles] = await Promise.all([
    prisma.client.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
    prisma.member.findMany({ where: { organizationId: membership.organizationId }, include: { user: { select: { id: true, name: true } } }, orderBy: { user: { name: "asc" } } }),
    prisma.crewProfile.findMany({ where: { organizationId: membership.organizationId, status: "active" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Link className="text-link" href="/studio/projects">← All projects</Link>
      <p className="eyebrow">D—TEAM PRODUCTION · PROJECT</p>
      <h1 className="studio-page-title">{project.name}<br /><em>{project.status}.</em></h1>
      <p className="studio-page-intro">{project.client?.name || "No client"}{project.service ? ` · ${project.service.name}` : ""} · Lead {project.lead?.name || "unassigned"} · {formatDate(project.startDate)} – {formatDate(project.endDate)} · {formatMoney(project.budgetAmount, project.currency)}</p>

      <section className="cms-panel studio-milestones-panel">
        <div className="cms-list-heading"><span>MILESTONES</span><span>{project.milestones.filter((milestone) => milestone.status === "complete").length} / {project.milestones.length} COMPLETE</span></div>
        {project.milestones.length > 0 && <div className="milestone-progress" aria-label={`${project.milestones.filter((milestone) => milestone.status === "complete").length} of ${project.milestones.length} milestones complete`}><span style={{ width: `${(project.milestones.filter((milestone) => milestone.status === "complete").length / project.milestones.length) * 100}%` }} /></div>}
        {project.milestones.length ? <ul className="milestone-list">{project.milestones.map((milestone) => (
          <li key={milestone.id}>
            <span className={`status-pill status-${milestone.status}`}>{milestone.status}</span>
            <div><strong>{milestone.title}</strong><span>{milestone.dueAt ? `Due ${formatDate(milestone.dueAt)}` : "No due date"}{milestone.description ? ` · ${milestone.description}` : ""}</span></div>
            {canUpdate && <div className="milestone-actions">
              {milestone.status !== "complete" && <form action={setMilestoneStatus.bind(null, project.id, milestone.id, "complete")}><button type="submit">Complete</button></form>}
              {milestone.status === "complete" && <form action={setMilestoneStatus.bind(null, project.id, milestone.id, "planned")}><button type="submit">Reopen</button></form>}
              <form action={deleteMilestone.bind(null, project.id, milestone.id)}><button type="submit">Delete</button></form>
            </div>}
          </li>
        ))}</ul> : <p>No milestones yet. Add the checkpoints that define progress for this project.</p>}
        {canUpdate && <details className="milestone-create"><summary>Add a milestone</summary>
          <form action={createMilestone.bind(null, project.id)} className="cms-form">
            <label>Title<input name="title" required minLength={2} maxLength={160} placeholder="Final delivery" /></label>
            <label>Status<select name="status" defaultValue="planned"><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="complete">Complete</option><option value="blocked">Blocked</option></select></label>
            <label>Due date<input name="dueAt" type="date" /></label>
            <label className="cms-wide">Description<textarea name="description" maxLength={2000} rows={2} /></label>
            <button type="submit">Add milestone</button>
          </form>
        </details>}
      </section>

      <section className="studio-detail-grid">
        <div className="studio-detail-panel">
          <h2>Schedule</h2>
          {project.scheduleItems.length ? <ul className="studio-mini-list">{project.scheduleItems.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{formatDateTime(item.startsAt)} – {formatDateTime(item.endsAt)}{item.location ? ` · ${item.location}` : ""}</span></li>)}</ul> : <p>No schedule items yet.</p>}
          <Link className="text-link" href={`/studio/calendar?project=${project.id}`}>Manage schedule ↗</Link>
        </div>
        <div className="studio-detail-panel">
          <h2>Quotes</h2>
          {project.quotes.length ? <ul className="studio-mini-list">{project.quotes.map((quote) => <li key={quote.id}><Link href={`/studio/quotes/${quote.id}`}><strong>{quote.number}</strong> <span>{quote.status} · {formatMoney(quote.total, quote.currency)}</span></Link></li>)}</ul> : <p>No quotes yet.</p>}
          <Link className="text-link" href={`/studio/quotes?project=${project.id}`}>Manage quotes ↗</Link>
        </div>
        <div className="studio-detail-panel">
          <h2>Deliverables</h2>
          {project.deliverables.length ? <ul className="studio-mini-list">{project.deliverables.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.status}{item.dueAt ? ` · due ${formatDate(item.dueAt)}` : ""}</span></li>)}</ul> : <p>No deliverables yet.</p>}
          <Link className="text-link" href={`/studio/deliverables?project=${project.id}`}>Manage deliverables ↗</Link>
        </div>
        <div className="studio-detail-panel">
          <h2>Media</h2>
          {project.mediaAssets.length ? <ul className="studio-mini-list">{project.mediaAssets.map((asset) => <li key={asset.id}><strong>{asset.filename}</strong><span>{asset.visibility} · {asset.mimeType}</span></li>)}</ul> : <p>No media attached yet.</p>}
          <Link className="text-link" href={`/studio/media?project=${project.id}`}>Open media library ↗</Link>
          {project.galleries.length > 0 && <p className="cms-entry-meta">{project.galleries.length} {project.galleries.length === 1 ? "gallery" : "galleries"}</p>}
        </div>
      </section>

      <section className="cms-panel">
        <div className="cms-list-heading"><span>CREW ASSIGNMENTS</span><span>{project.members.length} ASSIGNED</span></div>
        {project.members.length ? <ul className="studio-mini-list">{project.members.map((member) => (
          <li key={member.id}><strong>{member.crewProfile?.name || member.user?.name || "Unknown"}</strong><span>{member.role}{member.crewProfile?.departments.length ? ` · ${member.crewProfile.departments.join(" · ")}` : member.crewProfile?.department ? ` · ${member.crewProfile.department}` : ""}</span>
            {canAssign && <form action={removeProjectMember.bind(null, project.id, member.id)} className="inline-action"><button type="submit">Remove</button></form>}
          </li>
        ))}</ul> : <p>No crew assigned yet.</p>}
        {canAssign && crewProfiles.length > 0 && <form action={addProjectMember.bind(null, project.id)} className="cms-form">
          <label>Crew member<select name="crewProfileId" required defaultValue=""><option value="" disabled>Choose crew</option>{crewProfiles.map((crew) => <option key={crew.id} value={crew.id}>{crew.name} — {crew.role}</option>)}</select></label>
          <label>Project role<input name="role" required minLength={2} maxLength={120} placeholder="Director of photography" /></label>
          <button type="submit">Assign to project</button>
        </form>}
        {canAssign && crewProfiles.length === 0 && <p className="cms-entry-meta">Add crew profiles in <Link href="/studio/crew">Crew</Link> before assigning them.</p>}
      </section>

      {canUpdate && <section className="cms-panel">
        <details><summary>Edit project</summary>
          <form action={updateProject.bind(null, project.id)} className="cms-form">
            <label>Project name<input name="name" required minLength={2} maxLength={160} defaultValue={project.name} /></label>
            <label>URL slug<input name="slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={project.slug} /></label>
            <label>Client<select name="clientId" defaultValue={project.clientId ?? ""}><option value="">No client yet</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label>Service<select name="serviceId" defaultValue={project.serviceId ?? ""}><option value="">No service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
            <label>Project lead<select name="leadUserId" defaultValue={project.leadUserId ?? ""}><option value="">Unassigned</option>{members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}</select></label>
            <label>Status<select name="status" defaultValue={project.status}><option value="planning">Planning</option><option value="active">Active</option><option value="on-hold">On hold</option><option value="wrapped">Wrapped</option><option value="cancelled">Cancelled</option></select></label>
            <label>Start date<input name="startDate" type="date" defaultValue={project.startDate ? project.startDate.toISOString().slice(0, 10) : ""} /></label>
            <label>End date<input name="endDate" type="date" defaultValue={project.endDate ? project.endDate.toISOString().slice(0, 10) : ""} /></label>
            <label>Budget<input name="budgetAmount" type="number" min={0} step="0.01" defaultValue={project.budgetAmount === null ? "" : project.budgetAmount / 100} /></label>
            <label>Currency<input name="currency" maxLength={3} defaultValue={project.currency} /></label>
            <label className="cms-wide">Description<textarea name="description" maxLength={10000} rows={5} defaultValue={project.description ?? ""} /></label>
            <button type="submit">Save project changes</button>
          </form>
        </details>
      </section>}
    </>
  );
}
