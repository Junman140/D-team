import { notFound, redirect } from "next/navigation";
import { ContentSubnav } from "@/components/studio/content-subnav";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { createPackage, createService, deletePackage, setPackagePublication, setServicePublication, updatePackage, updateService } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Services | D-Team Production", robots: { index: false, follow: false } };

export default async function ContentServicesPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { content: ["read"] }))) notFound();

  const [canCreate, canUpdate, canPublish] = await Promise.all([
    hasStudioPermission(membership.organizationId, { content: ["create"] }),
    hasStudioPermission(membership.organizationId, { content: ["update"] }),
    hasStudioPermission(membership.organizationId, { content: ["publish"] }),
  ]);

  const prisma = getPrisma();
  const [services, packages] = await Promise.all([
    prisma.service.findMany({ where: { organizationId: membership.organizationId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.servicePackage.findMany({ where: { organizationId: membership.organizationId }, include: { service: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · WEBSITE</p>
      <h1 className="studio-page-title">What we make,<br /><em>clearly stated.</em></h1>
      <p className="studio-page-intro">Services and packages are drafts until an authorized editor publishes them. Package rates stay unpublished until the owner confirms them; leave the amount blank for quote-only work.</p>
      <ContentSubnav />

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW SERVICE</span>
        <h2>Add a service</h2>
        <form action={createService} className="cms-form">
          <label>Name<input name="name" required minLength={2} maxLength={120} /></label>
          <label>URL slug <span>(optional)</span><input name="slug" maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
          <label>Discipline<input name="discipline" required minLength={2} maxLength={80} placeholder="PRODUCTION" /></label>
          <label>Sort order<input name="sortOrder" type="number" defaultValue={services.length} /></label>
          <label className="cms-wide">Summary<textarea name="summary" required minLength={10} maxLength={500} rows={2} /></label>
          <label className="cms-wide">Description<textarea name="description" maxLength={5000} rows={4} /></label>
          <button type="submit">Save service draft</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>SERVICES</span><span>{services.length} TOTAL · {services.filter((service) => service.status === "published").length} PUBLISHED</span></div>
      {services.length ? <div className="cms-entry-list">{services.map((service) => (
        <article className="cms-entry" key={service.id}>
          <header><div><span className={`cms-status${service.status === "published" ? " is-published" : ""}`}>{service.status}</span><h2>{service.name}</h2><p>{service.discipline} · /services/{service.slug}</p></div>
            <a href={`/services/${service.slug}`} target="_blank" rel="noreferrer">{service.status === "published" ? "View public page" : "Preview draft"} ↗</a>
          </header>
          {canUpdate ? <details><summary>Edit service</summary>
            <form action={updateService.bind(null, service.id)} className="cms-form">
              <label>Name<input name="name" required minLength={2} maxLength={120} defaultValue={service.name} /></label>
              <label>URL slug<input name="slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={service.slug} /></label>
              <label>Discipline<input name="discipline" required minLength={2} maxLength={80} defaultValue={service.discipline} /></label>
              <label>Sort order<input name="sortOrder" type="number" defaultValue={service.sortOrder} /></label>
              <label className="cms-wide">Summary<textarea name="summary" required minLength={10} maxLength={500} rows={2} defaultValue={service.summary} /></label>
              <label className="cms-wide">Description<textarea name="description" maxLength={5000} rows={4} defaultValue={service.description ?? ""} /></label>
              <button type="submit">Save service changes</button>
            </form>
          </details> : <p>Read-only access.</p>}
          {canPublish && <form action={setServicePublication.bind(null, service.id, service.status !== "published")} className="cms-publication-form">
            <button type="submit">{service.status === "published" ? "Unpublish" : "Publish"}</button>
          </form>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No services yet.</h2><p>Add the capabilities the studio offers. Public pages keep their draft capability list until services are published.</p></div>}

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW PACKAGE</span>
        <h2>Add a package</h2>
        <form action={createPackage} className="cms-form">
          <label>Name<input name="name" required minLength={2} maxLength={120} /></label>
          <label>URL slug <span>(optional)</span><input name="slug" maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
          <label>Service<select name="serviceId" defaultValue=""><option value="">No specific service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
          <label>Sort order<input name="sortOrder" type="number" defaultValue={packages.length} /></label>
          <label>Price label <span>(optional display text)</span><input name="priceLabel" maxLength={120} placeholder="From ₦…" /></label>
          <label>Amount <span>(leave blank for custom quote)</span><input name="priceAmount" type="number" min={0} step="0.01" /></label>
          <label>Currency<input name="currency" maxLength={3} defaultValue="NGN" /></label>
          <label className="cms-wide">Summary<textarea name="summary" maxLength={1000} rows={2} /></label>
          <label className="cms-wide">Features <span>One per line</span><textarea name="features" rows={4} /></label>
          <button type="submit">Save package draft</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>PACKAGES</span><span>{packages.length} TOTAL · {packages.filter((entry) => entry.status === "published").length} PUBLISHED</span></div>
      {packages.length ? <div className="cms-entry-list">{packages.map((entry) => (
        <article className="cms-entry" key={entry.id}>
          <header><div><span className={`cms-status${entry.status === "published" ? " is-published" : ""}`}>{entry.status}</span><h2>{entry.name}</h2><p>{entry.service?.name ?? "No service"} · {entry.priceAmount === null ? "Custom quote" : `${entry.currency} ${(entry.priceAmount / 100).toFixed(2)}`}</p></div></header>
          {canUpdate ? <details><summary>Edit package</summary>
            <form action={updatePackage.bind(null, entry.id)} className="cms-form">
              <label>Name<input name="name" required minLength={2} maxLength={120} defaultValue={entry.name} /></label>
              <label>URL slug<input name="slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={entry.slug} /></label>
              <label>Service<select name="serviceId" defaultValue={entry.serviceId ?? ""}><option value="">No specific service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
              <label>Sort order<input name="sortOrder" type="number" defaultValue={entry.sortOrder} /></label>
              <label>Price label<input name="priceLabel" maxLength={120} defaultValue={entry.priceLabel ?? ""} /></label>
              <label>Amount<input name="priceAmount" type="number" min={0} step="0.01" defaultValue={entry.priceAmount === null ? "" : entry.priceAmount / 100} /></label>
              <label>Currency<input name="currency" maxLength={3} defaultValue={entry.currency} /></label>
              <label className="cms-wide">Summary<textarea name="summary" maxLength={1000} rows={2} defaultValue={entry.summary ?? ""} /></label>
              <label className="cms-wide">Features<textarea name="features" rows={4} defaultValue={entry.features.join("\n")} /></label>
              <button type="submit">Save package changes</button>
            </form>
            <form action={deletePackage.bind(null, entry.id)} className="cms-publication-form"><button type="submit">Delete package</button></form>
          </details> : <p>Read-only access.</p>}
          {canPublish && <form action={setPackagePublication.bind(null, entry.id, entry.status !== "published")} className="cms-publication-form">
            <button type="submit">{entry.status === "published" ? "Unpublish" : "Publish"}</button>
          </form>}
        </article>
      ))}</div> : <div className="studio-empty-panel"><h2>No packages yet.</h2><p>Public pricing stays in its pending state until packages are published.</p></div>}
    </>
  );
}
