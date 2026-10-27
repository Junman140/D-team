import { Showreel } from "@/components/public/showreel";
import { PhotoStory } from "@/components/public/photo-story";
import { Corners } from "@/components/public/corners";
import { LiveClock, ServicesMarquee } from "@/components/public/motion";
import { onSetGallery } from "@/features/media/on-set-images";
import { eventCovers, heroImage, introGallery, workMosaic } from "@/features/media/site-images";
import { listPortfolioEntries } from "@/features/portfolio/queries";
import { getSiteSetting, listServices, listSocialLinks, listTeamMembers } from "@/features/content/queries";
import { canPreviewContent } from "@/features/content/preview";
import { AGENCY_PILLARS, CONTACT_TEL_URL, CONTACT_TIKTOK_URL, CONTACT_WHATSAPP_URL, CONTACT_PHONE_DISPLAY } from "@/features/content/contact";
import { serviceOfferings } from "@/features/services/services";
import { formatGuideRate, packageOptions, quotationPdfPath } from "@/features/services/package-options";

export const dynamic = "force-dynamic";

const tones = ["project-frame--amber", "project-frame--blue", "project-frame--rose"] as const;

type HomepageSettings = {
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  availability?: string | null;
  intro?: string | null;
};

export default async function HomePage() {
  const preview = process.env.NODE_ENV === "development" || await canPreviewContent();
  const [cmsProjects, team, socials, services, homepage] = await Promise.all([
    listPortfolioEntries({ includeDrafts: preview }),
    listTeamMembers({ includeDrafts: preview, includeNamedPortraits: true }),
    listSocialLinks({ includeDrafts: preview }),
    listServices({ includeDrafts: preview }),
    getSiteSetting<HomepageSettings>("homepage"),
  ]);

  const projects = cmsProjects.slice(0, 6).map((project, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: project.title,
    category: project.categories.join(" · ") || "D—TEAM PORTFOLIO",
    tone: tones[index % tones.length],
    mark: `${project.title}\n${project.productionYear ?? "D—TEAM"}`,
    slug: project.slug,
    status: project.status,
    image: project.coverImageUrl
      ? {
          src: project.coverImageUrl,
          srcSet: undefined as string | undefined,
          width: undefined as unknown as number,
          height: undefined as unknown as number,
          alt: `${project.title} cover frame.`,
        }
      : eventCovers[project.slug],
  }));

  const eventColumns = [
    projects.filter((_, index) => index % 2 === 0),
    projects.filter((_, index) => index % 2 === 1),
  ];

  const serviceItems = (services.length ? services : serviceOfferings).map(({ slug, name }) => ({ slug, name }));

  return (
    <main id="main-content">
      <section className="hero" id="top" aria-labelledby="hero-title">
        <Corners className="hero-corners" />
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span className="pulse-dot" /> DYNAMIC CREATIVE AGENCY · NIGERIA</p>
          <h1 id="hero-title">Ideas into<br /><em>impact.</em></h1>
          <div className="hero-bottomline">
            <p>Media production, visual storytelling, branding, and<br />digital marketing—one team for the whole picture.</p>
            <a className="round-link" href="#work" aria-label="Explore selected work">↓</a>
          </div>
        </div>
        <div className="hero-art hero-art--photo">
          <img
            alt={heroImage.alt}
            className="hero-photo"
            height={heroImage.height}
            sizes="(max-width: 760px) 90vw, 44vw"
            src={heroImage.src}
            srcSet={heroImage.srcSet}
            width={heroImage.width}
          />
          <Corners className="hero-art-corners" />
          <div className="hero-art-grain" aria-hidden="true" />
          <div className="hero-art-caption" aria-hidden="true"><span>DT / 001</span><span>THE MAKING OF A MOMENT</span></div>
          <p className="hero-art-title" aria-hidden="true">IDEAS INTO<br />IMPACT<span>.</span></p>
          <div className="hero-stamp" aria-hidden="true">IDEA<br /><b>→</b><br />IMPACT</div>
        </div>
        <div className="hero-index"><span className="pulse-dot" aria-hidden="true" /><span>01</span><span className="index-line" data-reveal="line" /><span>04</span><span className="hero-index-label">SCROLL</span></div>
      </section>

      <section className="intro section-wrap" id="about">
        <p className="eyebrow">D TEAM · DYNAMIC CREATIVE AGENCY</p>
        <div className="intro-copy">
          <h2 data-reveal="mask">Transforming ideas into<br /><span>impactful experiences.</span></h2>
          <p>{homepage?.intro || "D Team is a dynamic creative agency committed to transforming ideas into impactful creative experiences. We combine media production, visual storytelling, branding, digital marketing, and strategic thinking to help businesses, organizations, ministries, and individuals communicate effectively and connect with their audiences."}</p>
        </div>
        <div className="intro-gallery" data-reveal>
          {introGallery.map((image, index) => (
            <figure className="intro-gallery-figure" key={image.id}>
              <img
                alt={image.alt}
                height={image.height}
                loading="lazy"
                sizes="(max-width: 760px) 46vw, 18vw"
                src={image.src}
                srcSet={image.srcSet}
                width={image.width}
              />
              <figcaption aria-hidden="true">{String(index + 1).padStart(2, "0")}</figcaption>
            </figure>
          ))}
        </div>
        <div className="intro-foot"><span>MEDIA PRODUCTION</span><i /> <span>BRANDING</span><i /> <span>DIGITAL MARKETING</span><i /> <span>CONSULTANCY</span><i /> <span>TRAINING</span></div>
      </section>

      <section className="showreel section-wrap" aria-labelledby="showreel-title">
        <div className="section-heading"><div><p className="eyebrow">THE D-TEAM SHOWREEL</p><h2 id="showreel-title">A year in<br /><em>the making.</em></h2></div><p className="section-aside">A first look at the people, places, and ideas behind the work.</p></div>
        <Showreel />
        <p className="asset-note">Crew-shot teaser clips. The approved final showreel will replace these before publication—everything plays on demand, nothing autoplays.</p>
      </section>

      <section className="on-set-story section-wrap" id="on-set" aria-labelledby="on-set-title">
        <div className="section-heading"><div><p className="eyebrow">ON SET · BEHIND THE WORK</p><h2 id="on-set-title">The crew<br /><em>in motion.</em></h2></div><p className="section-aside">Cameras, screens, sound, light, and the people making the moving parts work together. Supplied crew photography; publication approval and credits pending.</p></div>
        <PhotoStory images={onSetGallery} />
      </section>

      <section className="work section-wrap" id="work">
        <div className="section-heading">
          <div><p className="eyebrow">SELECTED WORK{projects.some((project) => project.status === "draft") ? " · DRAFT" : ""}</p><h2>Our work<br /><em>speaks.</em></h2></div>
          <a className="text-link" href="/work">View all work <span aria-hidden="true">↗</span></a>
        </div>
        <div className="event-columns">
          {eventColumns.map((column, columnIndex) => (
            <div className={`event-column${columnIndex === 1 ? " event-column--offset" : ""}`} key={columnIndex}>
              {column.map((project, index) => (
                <article className="project-card" data-reveal key={`${project.slug}-${index}`} style={{ transitionDelay: `${index * 90}ms` }}>
                  <div className={`project-frame ${project.tone}`}>
                    {project.image && (
                      <img
                        className="project-photo"
                        alt={project.image.alt}
                        height={project.image.height}
                        loading="lazy"
                        sizes="(max-width: 760px) 92vw, 45vw"
                        src={project.image.src}
                        srcSet={project.image.srcSet}
                        width={project.image.width}
                      />
                    )}
                    <Corners className="project-corners" />
                    <span className="project-photo-scrim" aria-hidden="true" />
                    <span className="frame-number">{project.number} / {String(projects.length).padStart(2, "0")}</span>
                    <span className="frame-mark">{project.mark.split("\n").map((line) => <span key={line}>{line}</span>)}</span>
                    <span className="frame-bottom">{project.status === "draft" ? "DRAFT PREVIEW" : "D—TEAM PORTFOLIO"} <span>{project.category}</span></span>
                  </div>
                  <div className="project-meta"><h3>{project.slug ? <a href={`/work/${project.slug}`}>{project.title}</a> : project.title}</h3><span>{project.category}</span></div>
                </article>
              ))}
            </div>
          ))}
        </div>
        {!projects.length && <p className="portfolio-empty-state">Published project stories are being prepared.</p>}
      </section>

      <section className="manifesto">
        <div className="manifesto-side"><span>02 / WHO WE ARE</span><span>IDEAS INTO IMPACT</span></div>
        <div className="manifesto-main">
          <p className="eyebrow">D TEAM WORKS ON FIVE PILLARS</p>
          <h2 data-reveal="mask">The pillars behind<br />every project we<br /><em>take on.</em></h2>
          <div className="pillar-cluster">
            {AGENCY_PILLARS.map((pillar, index) => (
              <article className="pillar-card" data-reveal key={pillar.number} style={{ transitionDelay: `${index * 80}ms` }}>
                <span className="pillar-number" aria-hidden="true">{pillar.number}</span>
                <h3>{pillar.name}</h3>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
          <a className="light-link" href="#team">Meet the 30-member team behind the work <span>↗</span></a>
        </div>
        <div className="manifesto-orbit" aria-hidden="true"><div className="orbit-ring orbit-ring-one" /><div className="orbit-ring orbit-ring-two" /><span>IDEA</span><span>PEOPLE</span><span>CRAFT</span></div>
      </section>

      <section className="statement section-wrap" aria-label="The D-Team approach">
        <p className="eyebrow">THE D—TEAM APPROACH</p>
        <p className="statement-copy" data-reveal>
          We combine{" "}
          <span className="statement-chip"><img alt="" height={introGallery[1].height} loading="lazy" src={introGallery[1].src} width={introGallery[1].width} /></span>{" "}
          skill and{" "}
          <span className="statement-chip"><img alt="" height={workMosaic[0].height} loading="lazy" src={workMosaic[0].src} width={workMosaic[0].width} /></span>{" "}
          originality to turn ideas into <em>impact.</em>
        </p>
      </section>

      <section className="team-preview section-wrap" id="team">
        <div className="section-heading"><div><p className="eyebrow">THE PEOPLE BEHIND THE WORK</p><h2>One crew.<br /><em>Many crafts.</em></h2></div><p className="section-aside">D Team currently stands at 30 members—creative direction, production, and craft working together from first conversation to final delivery.</p></div>
        <div className="homepage-team-grid">
          {team.slice(0, 3).map((member) => <article className="homepage-team-card" key={member.id}>
            <div className="homepage-team-portrait">{member.portraitUrl ? <img src={member.portraitUrl} alt={`D-Team crew member ${member.name}`} loading="lazy" /> : <span>{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>}<Corners className="portrait-corners" /></div>
            <p className="eyebrow">{member.department || "D—TEAM"}</p><h3>{member.name}</h3><p>{member.role}</p>
          </article>)}
        </div>
        <a className="text-link" href="/team">Meet the whole team <span aria-hidden="true">↗</span></a>
      </section>

      <section className="capabilities section-wrap" id="capabilities">
        <div className="section-heading capability-heading"><div><p className="eyebrow">WHAT WE BRING TO THE SET</p><h2>Full picture.<br /><em>Every detail.</em></h2></div><p className="section-aside">A connected crew of creatives, makers, and problem-solvers—ready to make the complicated feel effortless.</p></div>
        <ServicesMarquee services={serviceItems} />
        <a className="text-link capability-link" href="/services">Explore all {serviceItems.length} services <span aria-hidden="true">↗</span></a>
      </section>

      <section className="pricing-preview section-wrap" aria-labelledby="pricing-title">
        <p className="eyebrow">CURRENT QUOTATION GUIDE</p>
        <div className="pricing-preview-row"><div><h2 id="pricing-title">Clear scope.<br /><em>Right-sized crew.</em></h2><p>Equipment kits, production fees, and crew rates are available now. Your final quote reflects the equipment, time, and specialists your brief needs.</p></div><a className="text-link" href="/packages">See the full rate guide <span aria-hidden="true">↗</span></a></div>
        <ul className="homepage-package-list">{packageOptions.map((entry) => <li key={entry.id}><span>{entry.name}</span><strong>{formatGuideRate(entry.rateAmount)} / day</strong></li>)}</ul>
        <div className="packages-cta-actions"><a className="text-link" href={quotationPdfPath} target="_blank" rel="noreferrer">Open quotation PDF <span aria-hidden="true">↗</span></a><a className="text-link" href="/request-quote">Ask for a tailored quote <span aria-hidden="true">↗</span></a></div>
      </section>

      <section className="social-preview section-wrap" aria-labelledby="social-title">
        <p className="eyebrow">FOLLOW THE PROCESS</p><div className="social-preview-row"><h2 id="social-title">More from<br /><em>the D-Team.</em></h2>
          {socials.length > 0 ? <div className="homepage-social-links">{socials.slice(0, 4).map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.id}>{link.platform} <span aria-hidden="true">↗</span></a>)}</div> : <><div className="homepage-social-links"><a href={CONTACT_TIKTOK_URL} target="_blank" rel="noreferrer">TikTok <span aria-hidden="true">↗</span></a></div><p>Other official channels will be listed once confirmed.</p><span className="draft-tag">MORE CHANNELS PENDING</span></>}
        </div>
      </section>

      <section className="contact section-wrap" id="contact">
        <p className="eyebrow">HAVE A GOOD ONE IN MIND? TALK TO D TEAM</p>
        <div className="contact-row"><h2 data-reveal="mask">Let’s make<br /><em>it happen.</em></h2>
          <div className="contact-channels">
            <a className="contact-button contact-channel--whatsapp" href={CONTACT_WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp {CONTACT_PHONE_DISPLAY} <span aria-hidden="true">↗</span></a>
            <a className="contact-button contact-channel--call" href={CONTACT_TEL_URL}>Call {CONTACT_PHONE_DISPLAY} <span aria-hidden="true">↗</span></a>
            {homepage?.contactEmail ? <a className="contact-button" href={`mailto:${homepage.contactEmail}`}>{homepage.contactEmail} <span aria-hidden="true">↗</span></a> : null}
          </div>
        </div>
        <div className="contact-foot" id="contact-details">
          <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noreferrer">WHATSAPP {CONTACT_PHONE_DISPLAY}</a>
          <a href={CONTACT_TEL_URL}>CALL {CONTACT_PHONE_DISPLAY}</a>
          <a href={CONTACT_TIKTOK_URL} target="_blank" rel="noreferrer">TIKTOK</a>
          <span>{homepage?.contactAddress || "CONTACT ADDRESS PENDING CONFIRMATION"}</span>
          <span>{homepage?.availability || "AVAILABLE FOR SELECT PROJECTS"}</span>
        </div>
        <div className="contact-clock">
          <span>LAGOS, NG · WEST AFRICA TIME</span>
          <span className="contact-clock-time">WA · <LiveClock /></span>
          <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noreferrer">WHATSAPP <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </main>
  );
}
