import type { Metadata } from "next";
import Link from "next/link";
import { formatGuideRate, individualCrewGuide, individualEquipmentGuide, packageOptions, productionFeeGuide, quotationPdfPath } from "@/features/services/package-options";
import { listPackages, listServices } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { formatMoney } from "@/lib/format";
import QuoteBuilder from "@/components/public/quote-builder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rates and packages | D-Team Studio",
  description: "D-Team equipment kit rates, production fees, and individual crew rates from the current quotation guide.",
};

export default async function PackagesPage() {
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const [packages, services] = await Promise.all([
    listPackages({ includeDrafts: preview }),
    listServices({ includeDrafts: preview }),
  ]);

  return (
    <main className="packages-page" id="main-content">
      <header className="packages-hero section-wrap">
        <p className="eyebrow">D—TEAM STUDIO · CURRENT QUOTATION GUIDE</p>
        <h1 data-reveal="mask">Clear rates.<br /><em>Built around the brief.</em></h1>
        <p>Start with the equipment, production time, and crew your project needs. We combine those costs into a tailored quotation.</p>
        <div className="packages-cta-actions">
          <Link className="contact-button" href="/request-quote">Request a project quote <span aria-hidden="true">↗</span></Link>
          <a className="text-link" href={quotationPdfPath} target="_blank" rel="noreferrer">Open the quotation PDF <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="package-index section-wrap" aria-labelledby="package-index-title">
        <div className="section-heading">
          <div><p className="eyebrow">EQUIPMENT · PER DAY</p><h2 id="package-index-title">Choose the<br /><em>right setup.</em></h2></div>
          <p className="section-aside">Equipment is charged separately from the production fee, individual crew, and any extra technical requirements.</p>
        </div>
        <div className="editorial-package-grid">
          {packageOptions.map((entry, index) => (
            <article className="editorial-package-card" data-reveal key={entry.id} style={{ transitionDelay: `${index * 70}ms` }}>
              <span className="package-index-number">{String(index + 1).padStart(2, "0")}</span>
              <p className="eyebrow">EQUIPMENT KIT · PER DAY</p>
              <h2>{entry.name}</h2>
              <strong className="editorial-package-price">{formatGuideRate(entry.rateAmount)} / day</strong>
              <p>{entry.summary}</p>
              <p className="package-best-for"><span>GOOD FOR</span> {entry.bestFor}</p>
              <ul>{entry.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <Link className="text-link" href="/request-quote">Build a quote around this kit <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
        <details className="equipment-rate-details">
          <summary>See individual equipment rates</summary>
          <dl>{individualEquipmentGuide.map((entry) => <div key={entry.label}><dt>{entry.label}</dt><dd>{entry.rate}</dd></div>)}</dl>
        </details>
      </section>

      <QuoteBuilder />

      <section className="package-capabilities section-wrap" aria-labelledby="fee-guide-title">
        <div className="section-heading">
          <div><p className="eyebrow">PRODUCTION FEES</p><h2 id="fee-guide-title">Time and<br /><em>production.</em></h2></div>
          <p className="section-aside">The production fee covers D-Team’s operating crew and video editing. A dedicated director, sound, lighting, and special equipment can be added to the scope.</p>
        </div>
        <div className="rate-guide-list">
          {productionFeeGuide.map((entry, index) => (
            <article key={entry.label}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{entry.label}</h3><p>{entry.detail}</p></div><strong>{entry.rate}</strong></article>
          ))}
          <article><span>03</span><div><h3>Minimum full production engagement</h3><p>Applies to full production engagements. Single-item hire follows its rate card.</p></div><strong>₦300,000</strong></article>
        </div>
      </section>

      <section className="package-index section-wrap" aria-labelledby="crew-guide-title">
        <div className="section-heading">
          <div><p className="eyebrow">INDIVIDUAL CREW AND CONTENT</p><h2 id="crew-guide-title">Add the right<br /><em>specialists.</em></h2></div>
          <p className="section-aside">Crew is added to the equipment and production scope according to the work.</p>
        </div>
        <div className="rate-guide-list rate-guide-list--crew">
          {individualCrewGuide.map((entry, index) => (
            <article key={entry.label}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{entry.label}</h3></div><strong>{entry.day}<small>{entry.month}</small></strong></article>
          ))}
          <article><span>06</span><div><h3>Sound engineer and lighting</h3></div><strong>Quoted per job</strong></article>
        </div>
      </section>

      <section className="quotation-notes section-wrap">
        <p className="eyebrow">QUOTE NOTES</p>
        <ul>
          <li>Every event includes a sound card and two HDMI cables.</li>
          <li>Transport is covered by the event organisers.</li>
          <li>Airtel ODU internet is ₦20,000 per day when required.</li>
          <li>Lighting, sound equipment, LED screens, cranes, RED cameras, and dollies are quoted to the brief.</li>
          <li>Flagship and mega productions are scoped individually; proposed tiers in the quotation master are not fixed public package prices.</li>
        </ul>
        <div className="packages-cta-actions">
          <Link className="contact-button" href="/request-quote">Get a tailored quotation <span aria-hidden="true">↗</span></Link>
          <a className="text-link" href={quotationPdfPath} download>Download the quotation master PDF <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      {packages.length > 0 && <section className="package-index section-wrap" aria-labelledby="studio-offers-title">
        <div className="section-heading"><div><p className="eyebrow">{preview ? "STUDIO OFFERS · PREVIEW" : "STUDIO OFFERS"}</p><h2 id="studio-offers-title">Published<br /><em>packages.</em></h2></div></div>
        <div className="editorial-package-grid">
          {packages.map((entry, index) => (
            <article className="editorial-package-card" data-reveal key={entry.id} style={{ transitionDelay: `${index * 70}ms` }}>
              <span className="package-index-number">{String(index + 1).padStart(2, "0")}</span>
              <p className="eyebrow">{entry.status === "draft" ? "DRAFT PACKAGE" : entry.serviceName ?? "PACKAGE"}</p>
              <h2>{entry.name}</h2>
              <strong className="editorial-package-price">{entry.priceLabel || (entry.priceAmount ? formatMoney(entry.priceAmount, entry.currency) : "CUSTOM QUOTE")}</strong>
              {entry.summary && <p>{entry.summary}</p>}
              {entry.features.length > 0 && <ul>{entry.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}
              <Link className="text-link" href={`/request-quote?service=${entry.slug}`}>Discuss this package <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </section>}

      <section className="package-capabilities section-wrap" aria-labelledby="capabilities-title">
        <div className="section-heading">
          <div><p className="eyebrow">THE FULL CREW BEHIND THE PACKAGE</p><h2 id="capabilities-title">Every part<br /><em>of the picture.</em></h2></div>
          <Link className="text-link" href="/services">Explore all capabilities <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="package-capability-grid">{services.map((service, index) => (
          <Link href={`/services/${service.slug}`} key={service.slug}><span>{String(index + 1).padStart(2, "0")}</span><strong>{service.name}</strong><em>{service.summary}</em></Link>
        ))}</div>
      </section>
    </main>
  );
}
