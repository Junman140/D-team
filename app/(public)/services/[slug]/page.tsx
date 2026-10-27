import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, listPackages } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug, { includeDrafts: process.env.NODE_ENV === "development" || await canPreviewContent() });
  return service
    ? { title: `${service.name} | D-Team Studio`, description: service.summary, robots: { index: false, follow: false } }
    : { title: "Service not found | D-Team Studio", robots: { index: false, follow: false } };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const service = await getService(slug, { includeDrafts: preview });
  if (!service) notFound();
  const packages = (await listPackages({ includeDrafts: preview })).filter((entry) => entry.serviceName === service.name);

  return (
    <main className="service-detail section-wrap" id="main-content">
      <Link className="text-link" href="/services">← All services</Link>
      <p className="eyebrow">D—TEAM STUDIO · {service.discipline}</p>
      <h1>{service.name}<br /><em>Built around your brief.</em></h1>
      <p className="service-detail-summary">{service.summary}</p>
      {service.status === "draft" && <p className="draft-tag">DRAFT CAPABILITY · PREVIEW ONLY FOR AUTHORIZED STAFF</p>}
      <div className="service-detail-frame" role="img" aria-label="Approved D-Team service image pending">
        <span>SERVICE MEDIA PENDING APPROVAL</span>
      </div>
      <div className="service-detail-copy">
        {service.description && <p>{service.description}</p>}
        {packages.length > 0 ? <div className="package-list">{packages.map((entry) => (
          <article className="package-card" key={entry.id}>
            <span className="eyebrow">{entry.status === "draft" ? "DRAFT PACKAGE" : "PACKAGE"}</span>
            <h2>{entry.name}</h2>
            <strong>{entry.priceLabel || formatMoney(entry.priceAmount, entry.currency)}</strong>
            {entry.summary && <p>{entry.summary}</p>}
            {entry.features.length > 0 && <ul>{entry.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}
          </article>
        ))}</div> : <p className="draft-tag">DRAFT CAPABILITY · SCOPE TO BE CONFIRMED</p>}
        <p>We will shape the crew, production plan, and deliverables around what your project needs. Share a few details and the team can discuss scope and a custom quote.</p>
        <Link className="text-link" href="/request-quote">Request a custom quote <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
