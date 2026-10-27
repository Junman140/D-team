import type { Metadata } from "next";
import Link from "next/link";
import { OnSetGrid } from "@/components/public/on-set-grid";
import { listServices } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { onSetImages } from "@/features/media/on-set-images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services | D-Team Studio",
  description: "Production, image-making, creative, and digital capabilities from D-Team.",
  robots: { index: false, follow: false },
};

export default async function ServicesPage() {
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const services = await listServices({ includeDrafts: preview });

  return (
    <main className="services-page section-wrap" id="main-content">
      <div className="services-heading">
        <p className="eyebrow">D—TEAM STUDIO · SERVICES</p>
        <h1 data-reveal="mask">One crew.<br /><em>Many ways to make.</em></h1>
        <p>We bring creative and production disciplines together around the needs of each brief.</p>
        <span className="draft-tag">CAPABILITY LIST · OWNER REVIEW PENDING</span>
      </div>
      <OnSetGrid images={onSetImages.slice(2)} limit={4} />
      <div className="service-list">
        {services.map((service, index) => (
          <article className="service-row" data-reveal key={service.slug} style={{ transitionDelay: `${Math.min(index, 6) * 70}ms` }}>
            <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="eyebrow">{service.discipline}</p>
              <h2><Link href={`/services/${service.slug}`}>{service.name}<span aria-hidden="true">↗</span></Link></h2>
              <p>{service.summary}</p>
              {service.status === "draft" && <span className="draft-tag">DRAFT PREVIEW</span>}
            </div>
            <span className="service-pricing">CUSTOM QUOTE</span>
          </article>
        ))}
      </div>
      <p className="service-draft-note">Service descriptions and public package rates are being confirmed. Every project can currently be discussed as a custom quote.</p>
      <Link className="text-link" href="/request-quote">Tell us about your project <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
