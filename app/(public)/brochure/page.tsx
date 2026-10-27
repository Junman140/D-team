import type { Metadata } from "next";
import Link from "next/link";
import { OnSetGrid } from "@/components/public/on-set-grid";
import { PrintButton } from "@/components/public/print-button";
import { listServices } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { onSetFeature, onSetImages } from "@/features/media/on-set-images";
import { formatGuideRate, packageOptions, quotationPdfPath } from "@/features/services/package-options";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brochure | D-Team Studio",
  description: "A print-ready overview of D-Team production capabilities, process, and ways to work together.",
  robots: { index: false, follow: false },
};

const productionProcess = [
  ["01", "Understand", "We start with the brief, the audience, and the outcome. The useful questions come before the shot list."],
  ["02", "Shape", "We build the production plan, crew, schedule, technical scope, and deliverables around what the work needs."],
  ["03", "Make", "The team arrives prepared. Direction, camera, sound, light, screens, live output, and front of house work as one."],
  ["04", "Deliver", "We finish, organise, and hand over the assets with a clear review and delivery path."],
];

export default async function BrochurePage() {
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const services = await listServices({ includeDrafts: preview });
  const packageNames = packageOptions.map((entry) => entry.name);

  return (
    <main className="brochure-page" id="main-content">
      <div className="brochure-toolbar section-wrap">
        <div>
          <p className="eyebrow">D—TEAM STUDIO · BROCHURE</p>
          <span className="draft-tag">RATE GUIDE · FROM CURRENT QUOTATION</span>
        </div>
        <div className="brochure-toolbar-actions">
          <Link className="text-link" href="/packages">Compare packages <span aria-hidden="true">↗</span></Link>
          <a className="text-link" href={quotationPdfPath} target="_blank" rel="noreferrer">Quotation PDF <span aria-hidden="true">↗</span></a>
          <PrintButton />
        </div>
      </div>

      <article className="brochure-sheet">
        <header className="brochure-cover">
          <div className="brochure-cover-art">
            <img
              alt={onSetFeature.alt}
              height={onSetFeature.height}
              src={onSetFeature.src}
              srcSet={onSetFeature.srcSet}
              width={onSetFeature.width}
            />
            <span>ON SET / D—TEAM STUDIO</span>
          </div>
          <div className="brochure-cover-copy">
            <p className="eyebrow">CREATIVE PRODUCTION · NIGERIA</p>
            <h1>Ideas into<br /><em>impact.</em></h1>
            <p>One crew for the whole picture: creative direction, production, image-making, live output, technical craft, and delivery.</p>
            <div className="brochure-cover-meta"><span>D—TEAM STUDIO</span><span>CAPABILITIES · PROCESS · PACKAGES</span><span>2026</span></div>
          </div>
        </header>

        <section className="brochure-section" data-reveal>
          <div className="brochure-section-heading"><span>01</span><div><p className="eyebrow">WHAT WE BRING</p><h2>Full production.<br /><em>One accountable team.</em></h2></div></div>
          <div className="brochure-capability-list">
            {services.map((service, index) => (
              <div key={service.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{service.name}</strong>
                <p>{service.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="brochure-section brochure-on-set" data-reveal>
          <div className="brochure-section-heading"><span>02</span><div><p className="eyebrow">ON SET</p><h2>The work behind<br /><em>the work.</em></h2></div></div>
          <OnSetGrid images={onSetImages.slice(1)} limit={5} />
          <p className="brochure-caption">Production crew at work. Photographs supplied by D-Team; publication approval and credit treatment pending.</p>
        </section>

        <section className="brochure-section" data-reveal>
          <div className="brochure-section-heading"><span>03</span><div><p className="eyebrow">HOW WE WORK</p><h2>A clear path from<br /><em>idea to delivery.</em></h2></div></div>
          <div className="brochure-process">
            {productionProcess.map(([number, title, copy]) => (
              <div key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></div>
            ))}
          </div>
        </section>

        <section className="brochure-section" data-reveal>
          <div className="brochure-section-heading"><span>04</span><div><p className="eyebrow">WAYS TO WORK</p><h2>Right-sized for<br /><em>the brief.</em></h2></div></div>
          <div className="brochure-packages">
            {packageOptions.map((entry, index) => (
              <div key={entry.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{entry.name}</h3>
                <p>{entry.summary}</p>
                <strong>{formatGuideRate(entry.rateAmount)} / day</strong>
              </div>
            ))}
          </div>
          <p className="brochure-caption">These are equipment kit rates. Production fees, crew, and extras are priced separately in the tailored quote.</p>
        </section>

        <section className="brochure-final">
          <div>
            <p className="eyebrow">HAVE A GOOD ONE IN MIND?</p>
            <h2>Let’s make<br /><em>it happen.</em></h2>
          </div>
          <div>
            <p>Start with the brief, the date, and the outcome. We will come back with the right shape, crew, and next step.</p>
            <p className="brochure-contact-lines">Project inquiries: /request-quote<br />Contact details: pending owner approval<br />Social links: pending owner approval</p>
            <div className="brochure-final-actions">
              <Link className="contact-button" href="/request-quote">Start a project inquiry <span aria-hidden="true">↗</span></Link>
              <Link className="text-link" href="/packages">See {packageNames.length} package shapes <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
