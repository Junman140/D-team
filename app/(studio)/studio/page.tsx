import Link from "next/link";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { createInitialWorkspace } from "./actions";

export const metadata = { title: "Overview | D-Team Production", robots: { index: false, follow: false } };

export default async function StudioOverviewPage() {
  const { session, membership, canInitializeWorkspace } = await getStudioWorkspaceAccess();

  if (!membership) {
    return (
      <>
        <p className="eyebrow">D—TEAM PRODUCTION · OVERVIEW</p>
        <h1 className="studio-page-title">Good work starts<br /><em>with a good plan.</em></h1>
        <p className="studio-page-intro">Your private production workspace is ready for the project, crew, and scheduling modules.</p>
        <div className="studio-empty-panel">
          <span className="studio-empty-index">01 / WORKSPACE SETUP</span>
          <h2>Create the D-Team workspace.</h2>
          <p>This first setup creates the D-Team Production organization and assigns your account the owner role. Staff access stays invite-only.</p>
          {canInitializeWorkspace && (
            <form action={createInitialWorkspace} className="studio-setup-form">
              <button type="submit">Create D-Team workspace</button>
            </form>
          )}
        </div>
      </>
    );
  }

  const [canReadProjects, canReadSchedule, canReadInquiries, canReadQuotes, canReadDeliverables, canReadCrew] = await Promise.all([
    hasStudioPermission(membership.organizationId, { project: ["read"] }),
    hasStudioPermission(membership.organizationId, { schedule: ["read"] }),
    hasStudioPermission(membership.organizationId, { inquiry: ["read"] }),
    hasStudioPermission(membership.organizationId, { quote: ["read"] }),
    hasStudioPermission(membership.organizationId, { deliverable: ["read"] }),
    hasStudioPermission(membership.organizationId, { crew: ["read"] }),
  ]);
  const organizationId = membership.organizationId;
  const prisma = getPrisma();
  const now = new Date();
  const [projects, activeProjectCount, projectCount, crewCount, newInquiryCount, upcomingSchedule, milestones, deliverables, quotePipeline] = await Promise.all([
    canReadProjects ? prisma.project.findMany({
      where: { organizationId },
      include: { client: { select: { name: true } }, _count: { select: { milestones: true, members: true } } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 6,
    }) : Promise.resolve([]),
    canReadProjects ? prisma.project.count({ where: { organizationId, status: "active" } }) : Promise.resolve(0),
    canReadProjects ? prisma.project.count({ where: { organizationId } }) : Promise.resolve(0),
    canReadCrew ? prisma.crewProfile.count({ where: { organizationId, status: "active" } }) : Promise.resolve(0),
    canReadInquiries ? prisma.inquiry.count({ where: { organizationId, status: "new" } }) : Promise.resolve(0),
    canReadSchedule ? prisma.scheduleItem.findMany({
      where: { organizationId, endsAt: { gte: now } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { startsAt: "asc" },
      take: 6,
    }) : Promise.resolve([]),
    canReadProjects ? prisma.projectMilestone.findMany({
      where: { organizationId, status: { not: "complete" } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: 6,
    }) : Promise.resolve([]),
    canReadDeliverables ? prisma.deliverable.findMany({
      where: { organizationId, status: { not: "delivered" } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: 6,
    }) : Promise.resolve([]),
    canReadQuotes ? prisma.quote.aggregate({
      where: { organizationId, status: { in: ["draft", "sent"] } },
      _sum: { total: true },
      _count: true,
    }) : Promise.resolve({ _sum: { total: 0 }, _count: 0 }),
  ]);
  const overdueMilestones = milestones.filter((milestone) => milestone.dueAt && milestone.dueAt < now);
  const overdueDeliverables = deliverables.filter((deliverable) => deliverable.dueAt && deliverable.dueAt < now);

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · OVERVIEW</p>
      <div className="studio-dashboard-heading">
        <div><h1 className="studio-page-title">Good work starts<br /><em>with a good plan.</em></h1><p className="studio-page-intro">{membership.organization.name} · a live view of the work that needs attention.</p></div>
        <span className="studio-dashboard-date">{formatDate(now)}</span>
      </div>

      <div className="studio-kpi-grid">
        <Link href="/studio/projects"><span>Active projects</span><strong>{activeProjectCount}</strong><em>{projectCount} total</em></Link>
        {canReadCrew && <Link href="/studio/crew"><span>Active crew</span><strong>{crewCount}</strong><em>Across all departments</em></Link>}
        {canReadInquiries && <Link href="/studio/inquiries"><span>New inquiries</span><strong>{newInquiryCount}</strong><em>Waiting for review</em></Link>}
        {canReadQuotes && <Link href="/studio/quotes"><span>Open quote pipeline</span><strong>{formatMoney(quotePipeline._sum.total, "NGN")}</strong><em>{quotePipeline._count} open quotes</em></Link>}
        {canReadDeliverables && <Link href="/studio/deliverables"><span>Deliverables due</span><strong>{deliverables.length}</strong><em>{overdueDeliverables.length} overdue</em></Link>}
      </div>

      <div className="studio-dashboard-grid">
        {canReadProjects && <section className="studio-dashboard-panel">
          <div className="cms-list-heading"><span>PROJECTS IN MOTION</span><Link href="/studio/projects">All projects ↗</Link></div>
          {projects.length ? <ul className="dashboard-list">{projects.map((project) => <li key={project.id}><Link href={`/studio/projects/${project.id}`}><strong>{project.name}</strong><span>{project.client?.name || "No client"} · {project._count.members} crew · {project._count.milestones} milestones</span></Link><span className={`status-pill status-${project.status}`}>{project.status}</span></li>)}</ul> : <p className="studio-dashboard-empty">No projects yet.</p>}
        </section>}

        {canReadProjects && <section className="studio-dashboard-panel">
          <div className="cms-list-heading"><span>MILESTONES TO WATCH</span><span>{overdueMilestones.length} OVERDUE</span></div>
          {milestones.length ? <ul className="dashboard-list">{milestones.map((milestone) => <li key={milestone.id}><Link href={`/studio/projects/${milestone.project.id}`}><strong>{milestone.title}</strong><span>{milestone.project.name} · {milestone.dueAt ? `due ${formatDate(milestone.dueAt)}` : "no due date"}</span></Link><span className={`status-pill status-${milestone.status}`}>{milestone.status}</span></li>)}</ul> : <p className="studio-dashboard-empty">No open milestones.</p>}
        </section>}

        {canReadSchedule && <section className="studio-dashboard-panel">
          <div className="cms-list-heading"><span>NEXT ON THE CALENDAR</span><Link href="/studio/calendar">Open calendar ↗</Link></div>
          {upcomingSchedule.length ? <ul className="dashboard-list">{upcomingSchedule.map((item) => <li key={item.id}><div><strong>{item.title}</strong><span>{formatDateTime(item.startsAt)} · {item.project.name}{item.location ? ` · ${item.location}` : ""}</span></div></li>)}</ul> : <p className="studio-dashboard-empty">Nothing scheduled yet.</p>}
        </section>}

        {canReadDeliverables && <section className="studio-dashboard-panel">
          <div className="cms-list-heading"><span>DELIVERY QUEUE</span><Link href="/studio/deliverables">All deliverables ↗</Link></div>
          {deliverables.length ? <ul className="dashboard-list">{deliverables.map((deliverable) => <li key={deliverable.id}><div><strong>{deliverable.title}</strong><span>{deliverable.project.name} · {deliverable.dueAt ? `due ${formatDate(deliverable.dueAt)}` : "no due date"}</span></div><span className={`status-pill status-${deliverable.status}`}>{deliverable.status}</span></li>)}</ul> : <p className="studio-dashboard-empty">No open deliverables.</p>}
        </section>}
      </div>
    </>
  );
}
