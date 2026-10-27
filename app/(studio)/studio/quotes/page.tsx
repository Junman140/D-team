import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/format";
import { createQuote } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quotes | D-Team Production", robots: { index: false, follow: false } };

export default async function QuotesPage() {
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { quote: ["read"] }))) notFound();
  const canCreate = await hasStudioPermission(membership.organizationId, { quote: ["create"] });

  const prisma = getPrisma();
  const [quotes, projects, clients] = await Promise.all([
    prisma.quote.findMany({
      where: { organizationId: membership.organizationId },
      include: { project: { select: { id: true, name: true } }, client: { select: { name: true } }, _count: { select: { lineItems: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ where: { organizationId: membership.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <p className="eyebrow">D—TEAM PRODUCTION · QUOTES</p>
      <h1 className="studio-page-title">Clear numbers,<br /><em>locked history.</em></h1>
      <p className="studio-page-intro">Quotes hold line items in minor currency units. Accepting a quote locks an immutable snapshot so later package or rate edits cannot rewrite the agreed total.</p>

      {canCreate && <section className="cms-panel">
        <span className="studio-empty-index">NEW QUOTE</span>
        <h2>Start a quote</h2>
        <form action={createQuote} className="cms-form">
          <label>Project<select name="projectId" defaultValue=""><option value="">No project yet</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label>Client<select name="clientId" defaultValue=""><option value="">No client yet</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label>Quote number <span>(optional; generated if blank)</span><input name="number" maxLength={40} /></label>
          <label>Currency<input name="currency" maxLength={3} defaultValue="NGN" /></label>
          <label className="cms-wide">Notes<textarea name="notes" maxLength={5000} rows={3} /></label>
          <button type="submit">Create quote</button>
        </form>
      </section>}

      <div className="cms-list-heading"><span>QUOTES</span><span>{quotes.length} TOTAL</span></div>
      {quotes.length ? <div className="studio-card-grid">{quotes.map((quote) => (
        <Link className="studio-card" href={`/studio/quotes/${quote.id}`} key={quote.id}>
          <span className={`status-pill status-${quote.status}`}>{quote.status}</span>
          <h2>{quote.number}</h2>
          <p>{quote.project?.name || "No project"}{quote.client ? ` · ${quote.client.name}` : ""}</p>
          <dl>
            <div><dt>Total</dt><dd>{formatMoney(quote.total, quote.currency)}</dd></div>
            <div><dt>Lines</dt><dd>{quote._count.lineItems}</dd></div>
          </dl>
        </Link>
      ))}</div> : <div className="studio-empty-panel"><h2>No quotes yet.</h2><p>Create a quote, add line items, then send or accept it when the commercial details are agreed.</p></div>}
    </>
  );
}
