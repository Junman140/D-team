import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStudioWorkspaceAccess, hasStudioPermission } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { addQuoteLine, deleteQuoteLine, setQuoteDiscount, setQuoteStatus } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quote | D-Team Production", robots: { index: false, follow: false } };

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, membership } = await getStudioWorkspaceAccess();
  if (!session) redirect("/studio/sign-in");
  if (!membership) redirect("/studio/access-pending");
  if (!(await hasStudioPermission(membership.organizationId, { quote: ["read"] }))) notFound();

  const [canUpdate, canApprove] = await Promise.all([
    hasStudioPermission(membership.organizationId, { quote: ["update"] }),
    hasStudioPermission(membership.organizationId, { quote: ["approve"] }),
  ]);
  const quote = await getPrisma().quote.findFirst({
    where: { id, organizationId: membership.organizationId },
    include: { project: { select: { id: true, name: true } }, client: { select: { name: true } }, lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!quote) notFound();
  const locked = quote.status === "accepted";

  return (
    <>
      <Link className="text-link" href="/studio/quotes">← All quotes</Link>
      <p className="eyebrow">D—TEAM PRODUCTION · QUOTE</p>
      <h1 className="studio-page-title">{quote.number}<br /><em>{quote.status}.</em></h1>
      <p className="studio-page-intro">{quote.project?.name || "No project"}{quote.client ? ` · ${quote.client.name}` : ""}{quote.acceptedAt ? ` · Accepted ${formatDate(quote.acceptedAt)}` : ""}</p>

      <section className="cms-panel">
        <div className="cms-list-heading"><span>LINE ITEMS</span><span>{formatMoney(quote.total, quote.currency)}</span></div>
        {quote.lineItems.length ? <div className="studio-table-wrap"><table className="studio-table">
          <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Total</th><th /></tr></thead>
          <tbody>{quote.lineItems.map((line) => <tr key={line.id}>
            <td>{line.description}</td><td>{line.quantity}</td><td>{formatMoney(line.unitAmount, quote.currency)}</td><td>{formatMoney(line.total, quote.currency)}</td>
            <td>{canUpdate && !locked && <form action={deleteQuoteLine.bind(null, quote.id, line.id)} className="inline-action"><button type="submit">Remove</button></form>}</td>
          </tr>)}</tbody>
        </table></div> : <p>No line items yet.</p>}
        <p className="cms-entry-meta">Subtotal {formatMoney(quote.subtotal, quote.currency)}{quote.discountAmount > 0 ? ` · Discount${quote.discountLabel ? ` (${quote.discountLabel})` : ""} −${formatMoney(quote.discountAmount, quote.currency)}` : ""} · Total {formatMoney(quote.total, quote.currency)}</p>
        {canUpdate && !locked && <form action={addQuoteLine.bind(null, quote.id)} className="cms-form">
          <label className="cms-wide">Description<input name="description" required minLength={2} maxLength={500} /></label>
          <label>Quantity<input name="quantity" type="number" min={1} max={10000} defaultValue={1} /></label>
          <label>Unit amount<input name="unitAmount" type="number" min={0} step="0.01" required /></label>
          <button type="submit">Add line item</button>
        </form>}
        {canUpdate && !locked && <details className="quote-discount"><summary>{quote.discountAmount > 0 ? "Edit discount" : "Apply a discount"}</summary>
          <form action={setQuoteDiscount.bind(null, quote.id)} className="cms-form">
            <label>Discount label <span>(optional)</span><input name="discountLabel" maxLength={160} defaultValue={quote.discountLabel ?? ""} placeholder="Returning client" /></label>
            <label>Discount amount<input name="discountAmount" type="number" min={0} step="0.01" defaultValue={(quote.discountAmount / 100).toFixed(2)} /></label>
            <button type="submit">Save discount</button>
          </form>
        </details>}
        {quote.notes && <p className="cms-entry-meta">Notes: {quote.notes}</p>}
      </section>

      <section className="cms-panel">
        <h2>Status</h2>
        {locked ? <p>This quote is accepted and locked. Its snapshot preserves the agreed total and line items.</p> : <div className="inquiry-actions">
          {canUpdate && quote.status !== "sent" && <form action={setQuoteStatus.bind(null, quote.id, "sent")}><button type="submit">Mark sent</button></form>}
          {canUpdate && quote.status !== "draft" && <form action={setQuoteStatus.bind(null, quote.id, "draft")}><button type="submit">Return to draft</button></form>}
          {canUpdate && quote.status !== "declined" && <form action={setQuoteStatus.bind(null, quote.id, "declined")}><button type="submit">Mark declined</button></form>}
          {canApprove && <form action={setQuoteStatus.bind(null, quote.id, "accepted")}><button type="submit" className="primary-action">Accept and lock quote</button></form>}
        </div>}
        {quote.acceptedSnapshot !== null && <details><summary>View accepted snapshot</summary><pre className="snapshot-json">{JSON.stringify(quote.acceptedSnapshot, null, 2)}</pre></details>}
      </section>
    </>
  );
}
