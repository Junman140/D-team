import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDateTime, toDateTimeLocal } from "@/lib/format";
import { createCallSheet, createScheduleItem, deleteScheduleItem, updateScheduleItem } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar | D-Team Production", robots: { index: false, follow: false } };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: projectFilter } = await searchParams;
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { schedule: ["read"] }))) notFound();

  const [canCreate, canUpdate, canDelete] = await Promise.all([
    hasStudioPermission(membership.organizationId, { schedule: ["create"] }),
    hasStudioPermission(membership.organizationId, { schedule: ["update"] }),
    hasStudioPermission(membership.organizationId, { schedule: ["delete"] }),
  ]);
  const prisma = getPrisma();
  const [projects, items, availability] = await Promise.all([
    prisma.project.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
    prisma.scheduleItem.findMany({
      where: { organizationId: membership.organizationId, ...(projectFilter ? { projectId: projectFilter } : {}) },
      include: { project: { select: { id: true, name: true } }, callSheets: { select: { id: true, title: true, shareToken: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.crewAvailability.findMany({
      where: { crewProfile: { organizationId: membership.organizationId }, endsAt: { gte: new Date() } },
      include: { crewProfile: { select: { name: true, role: true } } },
      orderBy: { startsAt: "asc" },
      take: 20,
    }),
  ]);
  const filteredProject = projectFilter ? projects.find((project) => project.id === projectFilter) : null;

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · CALENDAR</p>
      <h1 className="studio-page-title">Every call,<br /><em>in time.</em></h1>
      <p className="studio-page-intro">Schedule items are project-scoped. Call sheets are private workspace links; opening one still requires an authorized staff session.</p>
      {filteredProject && <p className="cms-entry-meta">Filtered to {filteredProject.name} · <Link href="/studio/calendar">Clear filter</Link></p>}

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW SCHEDULE ITEM</span>
        <h2>Add a call</h2>
        <form action={createScheduleItem} className="cms-form">
          <label>Project<select name="projectId" required defaultValue={projectFilter ?? ""}><option value="" disabled>Choose project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label>Title<input name="title" required minLength={2} maxLength={160} placeholder="Shoot day 01" /></label>
          <label>Starts<input name="startsAt" type="datetime-local" required /></label>
          <label>Ends<input name="endsAt" type="datetime-local" required /></label>
          <label>Location<input name="location" maxLength={300} /></label>
          <label className="cms-wide">Notes<textarea name="notes" maxLength={5000} rows={3} /></label>
          <button type="submit">Add to calendar</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>SCHEDULE</span><span>{items.length} ITEMS</span></div>
      {items.length ? <div className="cms-entry-list">{items.map((item) => (
        <article className="cms-entry" key={item.id}>
          <header><div><span className="eyebrow">{formatDateTime(item.startsAt)}</span><h2>{item.title}</h2><p>{item.project.name}{item.location ? ` · ${item.location}` : ""} · Ends {formatDateTime(item.endsAt)}</p></div></header>
          {item.notes && <p className="cms-entry-meta">{item.notes}</p>}
          {item.callSheets.length > 0 && <ul className="studio-mini-list">{item.callSheets.map((sheet) => <li key={sheet.id}><strong>{sheet.title}</strong><span><Link href={`/studio/calendar/call-sheets/${sheet.shareToken}`}>Open call sheet ↗</Link></span></li>)}</ul>}
          {canCreate && <form action={createCallSheet.bind(null, item.id)} className="cms-form">
            <label>Call sheet title<input name="title" maxLength={160} defaultValue={`${item.project.name} — ${item.title}`} /></label>
            <label>Location override<input name="location" maxLength={300} defaultValue={item.location ?? ""} /></label>
            <label className="cms-wide">Notes<textarea name="notes" maxLength={5000} rows={2} defaultValue={item.notes ?? ""} /></label>
            <button type="submit">Create call sheet</button>
          </form>}
          {canUpdate && <details><summary>Edit schedule item</summary>
            <form action={updateScheduleItem.bind(null, item.id)} className="cms-form">
              <label>Project<select name="projectId" required defaultValue={item.projectId}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label>Title<input name="title" required minLength={2} maxLength={160} defaultValue={item.title} /></label>
              <label>Starts<input name="startsAt" type="datetime-local" required defaultValue={toDateTimeLocal(item.startsAt)} /></label>
              <label>Ends<input name="endsAt" type="datetime-local" required defaultValue={toDateTimeLocal(item.endsAt)} /></label>
              <label>Location<input name="location" maxLength={300} defaultValue={item.location ?? ""} /></label>
              <label className="cms-wide">Notes<textarea name="notes" maxLength={5000} rows={3} defaultValue={item.notes ?? ""} /></label>
              <button type="submit">Save schedule changes</button>
            </form>
          </details>}
          {canDelete && <form action={deleteScheduleItem.bind(null, item.id)} className="cms-publication-form"><button type="submit">Delete schedule item</button></form>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No schedule items yet.</h2><p>Add a call to start building the production calendar.</p></div>}

      <div className="cms-list-heading"><span>UPCOMING CREW AVAILABILITY</span><span>{availability.length} ENTRIES</span></div>
      {availability.length ? <ul className="studio-mini-list">{availability.map((slot) => <li key={slot.id}><strong>{slot.crewProfile.name}</strong><span>{slot.status} · {formatDateTime(slot.startsAt)} – {formatDateTime(slot.endsAt)}{slot.note ? ` · ${slot.note}` : ""}</span></li>)}</ul> : <p className="cms-entry-meta">No upcoming availability recorded.</p>}
    </>
  );
}
