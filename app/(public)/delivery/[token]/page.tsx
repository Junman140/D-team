import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project delivery | D-Team Studio",
  description: "A private D-Team project delivery page.",
  robots: { index: false, follow: false },
};

export default async function DeliveryPage({ params }: { params: Promise<{ token: string }> }) {
  if (!process.env.DATABASE_URL) notFound();
  const { token } = await params;
  const deliverable = await getPrisma().deliverable.findFirst({
    where: {
      deliveryToken: token,
      deliveryRevokedAt: null,
      OR: [{ deliveryExpiresAt: null }, { deliveryExpiresAt: { gt: new Date() } }],
    },
    include: { project: { select: { name: true } } },
  });
  if (!deliverable) notFound();

  return (
    <main className="delivery-page section-wrap" id="main-content">
      <p className="eyebrow">D—TEAM STUDIO · PROJECT DELIVERY</p>
      <h1>{deliverable.title}<br /><em>Ready when you are.</em></h1>
      <p className="delivery-project">{deliverable.project.name}</p>
      <div className="delivery-meta">
        <div><span>STATUS</span><strong>{deliverable.status}</strong></div>
        <div><span>DUE</span><strong>{formatDate(deliverable.dueAt)}</strong></div>
        <div><span>DELIVERED</span><strong>{formatDate(deliverable.deliveredAt)}</strong></div>
        <div><span>LINK EXPIRES</span><strong>{formatDate(deliverable.deliveryExpiresAt)}</strong></div>
      </div>
      {deliverable.description && <p className="delivery-description">{deliverable.description}</p>}
      {deliverable.reviewUrl ? (
        <a className="delivery-review-link" href={deliverable.reviewUrl} target="_blank" rel="noreferrer">
          Open the delivery <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <p className="delivery-note">The delivery file or review link has not been attached yet. The D-Team will update this page when it is ready.</p>
      )}
      <p className="delivery-note">This is a private link. Please do not forward it beyond the intended recipient. Access ends on the expiry date or when D-Team revokes the link.</p>
      <a className="text-link" href="/">D—Team Studio <span aria-hidden="true">↗</span></a>
    </main>
  );
}
