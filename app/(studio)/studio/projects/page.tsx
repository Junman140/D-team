import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { createProject } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects | D-Team Production", robots: { index: false, follow: false } };

export default async function ProjectsPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { project: ["read"] }))) notFound();
  const canCreate = await hasStudioPermission(membership.organizationId, { project: ["create"] });

  const prisma = getPrisma();
  const [projects, clients, services, members] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: membership.organizationId },
      include: { client: true, service: true, lead: { select: { name: true } }, _count: { select: { members: true, scheduleItems: true, deliverables: true, milestones: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.client.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
    prisma.member.findMany({ where: { organizationId: membership.organizationId }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { user: { name: "asc" } } }),
  ]);

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · PROJECTS</p>
      <h1 className="studio-page-title">Every production,<br /><em>one clear plan.</em></h1>
      <p className="studio-page-intro">Projects connect clients, crew, schedules, quotes, deliverables, and media. Access follows the workspace role matrix.</p>

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW PROJECT</span>
        <h2>Start a project</h2>
        <form action={createProject} className="cms-form">
          <label>Project name<input name="name" required minLength={2} maxLength={160} /></label>
          <label>URL slug <span>(optional)</span><input name="slug" maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
          <label>Client<select name="clientId" defaultValue=""><option value="">No client yet</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label>Service<select name="serviceId" defaultValue=""><option value="">No service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
          <label>Project lead<select name="leadUserId" defaultValue=""><option value="">Unassigned</option>{members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}</select></label>
          <label>Status<select name="status" defaultValue="planning"><option value="planning">Planning</option><option value="active">Active</option><option value="on-hold">On hold</option><option value="wrapped">Wrapped</option><option value="cancelled">Cancelled</option></select></label>
          <label>Start date<input name="startDate" type="date" /></label>
          <label>End date<input name="endDate" type="date" /></label>
          <label>Budget<input name="budgetAmount" type="number" min={0} step="0.01" /></label>
          <label>Currency<input name="currency" maxLength={3} defaultValue="NGN" /></label>
          <label className="cms-wide">Description<textarea name="description" maxLength={10000} rows={4} /></label>
          <button type="submit">Create project</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>PROJECTS</span><span>{projects.length} TOTAL</span></div>
      {projects.length ? <div className="studio-card-grid">{projects.map((project) => (
        <Link className="studio-card" href={`/studio/projects/${project.id}`} key={project.id}>
          <span className={`status-pill status-${project.status}`}>{project.status}</span>
          <h2>{project.name}</h2>
          <p>{project.client?.name || "No client"}{project.service ? ` · ${project.service.name}` : ""}</p>
          <dl>
            <div><dt>Lead</dt><dd>{project.lead?.name || "Unassigned"}</dd></div>
            <div><dt>Dates</dt><dd>{formatDate(project.startDate)} – {formatDate(project.endDate)}</dd></div>
            <div><dt>Budget</dt><dd>{formatMoney(project.budgetAmount, project.currency)}</dd></div>
            <div><dt>Crew</dt><dd>{project._count.members}</dd></div>
            <div><dt>Schedule</dt><dd>{project._count.scheduleItems}</dd></div>
            <div><dt>Deliverables</dt><dd>{project._count.deliverables}</dd></div>
            <div><dt>Milestones</dt><dd>{project._count.milestones}</dd></div>
          </dl>
        </Link>
      ))}</div> : <div className="studio-empty-panel"><h2>No projects yet.</h2><p>Create a project or convert an inquiry into a client and project.</p></div>}
    </>
  );
}
