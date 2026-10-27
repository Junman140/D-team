import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDateTime, toDateTimeLocal } from "@/lib/format";
import { crewDepartments } from "@/features/crew/departments";
import { addCrewAvailability, createCrewProfile, deleteCrewAvailability, updateCrewProfile } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Crew | D-Team Production", robots: { index: false, follow: false } };

export default async function CrewPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { crew: ["read"] }))) notFound();

  const canUpdate = await hasStudioPermission(membership.organizationId, { crew: ["update"] });
  const canAssign = await hasStudioPermission(membership.organizationId, { crew: ["assign"] });
  const prisma = getPrisma();
  const [crew, members] = await Promise.all([
    prisma.crewProfile.findMany({
      where: { organizationId: membership.organizationId },
      include: { availability: { orderBy: { startsAt: "asc" }, take: 12 }, user: { select: { name: true, email: true } }, _count: { select: { projectMembers: true } } },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.member.findMany({ where: { organizationId: membership.organizationId }, include: { user: { select: { id: true, name: true } } }, orderBy: { user: { name: "asc" } } }),
  ]);

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · CREW</p>
      <h1 className="studio-page-title">The right people,<br /><em>in the right place.</em></h1>
      <p className="studio-page-intro">Crew profiles hold departments and skills. Availability entries are private to the workspace and can be assigned across multiple projects.</p>

      {canUpdate && <section className="cms-panel">
        <span className="studio-empty-index">NEW CREW PROFILE</span>
        <h2>Add a crew member</h2>
        <form action={createCrewProfile} className="cms-form">
          <label>Name<input name="name" required minLength={2} maxLength={160} /></label>
          <label>Role<input name="role" required minLength={2} maxLength={120} /></label>
          <label>Primary department<input name="department" maxLength={120} placeholder="Production" /></label>
          <fieldset className="cms-wide cms-checkbox-fieldset"><legend>Departments <span>Select all that apply</span></legend><div className="cms-checkbox-grid">{crewDepartments.map((department) => <label key={department}><input type="checkbox" name="departments" value={department} /> {department}</label>)}</div></fieldset>
          <label>Staff account<select name="userId" defaultValue=""><option value="">No linked account</option>{members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}</select></label>
          <label>Email<input name="email" type="email" maxLength={254} /></label>
          <label>Phone<input name="phone" maxLength={80} /></label>
          <label>Status<select name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          <label className="cms-wide">Skills <span>One per line</span><textarea name="skills" rows={4} /></label>
          <button type="submit">Save crew profile</button>
        </form>
      </section>}

      <section className="cms-panel department-review">
        <div className="cms-list-heading"><span>DEPARTMENT REVIEW</span><span>{crewDepartments.length} DEPARTMENTS</span></div>
        <div className="department-review-grid">{crewDepartments.map((department) => {
          const members = crew.filter((entry) => entry.departments.includes(department) || entry.department === department);
          return <div key={department}><span>{department}</span><strong>{members.length}</strong><p>{members.length ? members.map((member) => member.name).join(" · ") : "No crew assigned yet."}</p></div>;
        })}</div>
        <p className="cms-entry-meta">Crew can belong to more than one department. Project assignments and availability remain private to the workspace.</p>
      </section>

      <div className="cms-list-heading"><span>CREW DIRECTORY</span><span>{crew.length} TOTAL · {crew.filter((entry) => entry.status === "active").length} ACTIVE</span></div>
      {crew.length ? <div className="cms-entry-list">{crew.map((entry) => (
        <article className="cms-entry" key={entry.id}>
          <header><div><span className={`cms-status${entry.status === "active" ? " is-published" : ""}`}>{entry.status}</span><h2>{entry.name}</h2><p>{entry.role}{entry.departments.length ? ` · ${entry.departments.join(" · ")}` : entry.department ? ` · ${entry.department}` : ""}{entry.email ? ` · ${entry.email}` : ""} · {entry._count.projectMembers} project {entry._count.projectMembers === 1 ? "assignment" : "assignments"}</p></div></header>
          {entry.skills.length > 0 && <p className="cms-entry-meta">Skills: {entry.skills.join(" · ")}</p>}
          {canUpdate && <details><summary>Edit profile</summary>
            <form action={updateCrewProfile.bind(null, entry.id)} className="cms-form">
              <label>Name<input name="name" required minLength={2} maxLength={160} defaultValue={entry.name} /></label>
              <label>Role<input name="role" required minLength={2} maxLength={120} defaultValue={entry.role} /></label>
              <label>Primary department<input name="department" maxLength={120} defaultValue={entry.department ?? ""} /></label>
              <fieldset className="cms-wide cms-checkbox-fieldset"><legend>Departments <span>Select all that apply</span></legend><div className="cms-checkbox-grid">{crewDepartments.map((department) => <label key={department}><input type="checkbox" name="departments" value={department} defaultChecked={entry.departments.includes(department) || entry.department === department} /> {department}</label>)}</div></fieldset>
              <label>Staff account<select name="userId" defaultValue={entry.userId ?? ""}><option value="">No linked account</option>{members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}</select></label>
              <label>Email<input name="email" type="email" maxLength={254} defaultValue={entry.email ?? ""} /></label>
              <label>Phone<input name="phone" maxLength={80} defaultValue={entry.phone ?? ""} /></label>
              <label>Status<select name="status" defaultValue={entry.status}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
              <label className="cms-wide">Skills<textarea name="skills" rows={4} defaultValue={entry.skills.join("\n")} /></label>
              <button type="submit">Save profile changes</button>
            </form>
          </details>}
          <details><summary>Availability ({entry.availability.length})</summary>
            {entry.availability.length > 0 ? <ul className="studio-mini-list">{entry.availability.map((slot) => <li key={slot.id}><strong>{slot.status}</strong><span>{formatDateTime(slot.startsAt)} – {formatDateTime(slot.endsAt)}{slot.note ? ` · ${slot.note}` : ""}</span>{canAssign && <form action={deleteCrewAvailability.bind(null, entry.id, slot.id)} className="inline-action"><button type="submit">Remove</button></form>}</li>)}</ul> : <p>No availability recorded.</p>}
            {canAssign && <form action={addCrewAvailability.bind(null, entry.id)} className="cms-form">
              <label>Starts<input name="startsAt" type="datetime-local" required /></label>
              <label>Ends<input name="endsAt" type="datetime-local" required /></label>
              <label>Status<select name="status" defaultValue="available"><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>
              <label>Note<input name="note" maxLength={500} /></label>
              <button type="submit">Add availability</button>
            </form>}
          </details>
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No crew profiles yet.</h2><p>Add the departments and skills the studio works with, then assign crew to projects.</p></div>}
    </>
  );
}
