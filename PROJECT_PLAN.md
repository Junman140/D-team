# D-Team Studio + Production — Build Plan

**Status:** Implementation in progress from the local YAW repository audit  
**Date:** 21 October 2026  
**Project location:** `/home/junman-samuel/Public/media/D-Team`  
**Reference source:** `/home/junman-samuel/Public/media/YAW`

**Execution tracker:** [DELIVERY_SLICES.md](./DELIVERY_SLICES.md) lists the implementation slices, dependencies, acceptance criteria, and current status. Use it as the active follow-up record.

**24 October 2026 — updated design audit:** the owner requested persistent motion across the experience. Added slow ambient drift to the hero and photo-story image, restored photo-story auto-advance with an explicit pause control, and retained reduced-motion handling. Fixed a production leak where hard-coded draft portfolio items appeared on the homepage when the CMS had no published work; they now appear only in development or authorized previews. Corrected the static VC Townhall Meeting slug/cover key and strengthened repeated story-dialog labels and keyboard wrapping. `pnpm exec tsc --noEmit` and `pnpm build` pass; live review confirmed photo-story advance/pause behavior and a no-database production run confirmed that no draft case studies reach the homepage. Remaining visual/release gates are listed in `UI_UX_PLAN.md` and `DELIVERY_SLICES.md`.

**24 October 2026 — Studio and motion follow-up:** refreshed the Studio with a dark responsive workspace rail, collapsible phone navigation, clearer input focus states, and restrained state-based motion. Added a public global motion pause control that also pauses the photo-story timer. Added dev-only roster and NGN package examples using the existing named portrait assets; the roles/rates are explicit samples, preview-only, and never written to CMS or exposed in production. The deeper Studio review found remaining opportunities around list search/filtering, destructive-action confirmation, and phone-sized media tables. See `UI_UX_PLAN.md` for detailed owner and release gates.

## Current implementation state · 21 October 2026

- S0 and S1 are complete. S2 and S3 have implemented the public story, work index, case study, and homepage content from the published CMS, but remain in progress because approved media and project content are still placeholders.
- S4 is in progress: Gmail SMTP inquiry alerts, persisted delivery status, error visibility, and staff retry are implemented alongside PostgreSQL inquiry persistence, confirmation, rate limiting, and the staff inbox. A `/packages` page, expanded catalog, budget planner, and print-ready `/brochure` route are built. `PUBLIC_INQUIRIES_ENABLED` defaults to false pending deployment and privacy configuration.
- S5 is in progress: PostgreSQL/Prisma schema and migrations, Better Auth sign-in, closed public registration, proposed staff roles, server permission helpers, and the first-admin/workspace setup path are implemented. Clean migration and role-boundary checks passed earlier on a disposable database; no host, staging, or production database is selected.
- S6's local implementation is complete and verified on a disposable database: portfolio, services/packages, team, journal, social links, homepage settings, preview, publication state, and revision history are managed in `/studio/content`. Public queries are organization-scoped and publication-aware, and mutations are audited.
- S7–S11 local implementations are in place: clients/projects with milestones and an overview dashboard; crew/availability/calendar/private call sheets with multi-department review; quotes with accepted snapshots and deliverables with revocable external delivery links; private Vercel Blob uploads, galleries, share grants, and `/g/[token]`; and public team/journal/social pages. Core journeys were exercised on a disposable database. Quote discounts are now built. Remaining scope is staging review and S12 hardening.
- `npx tsc --noEmit`, `pnpm db:validate`, `pnpm auth:schema-check`, and `pnpm build` passed on 21 October 2026, and the Turbopack dynamic-filesystem warning from the local media adapter was resolved. A no-database production smoke test returned 200 for the public homepage, work, services, pricing, team, journal, socials, privacy, terms, and quote routes, a 307 sign-in redirect for `/studio`, and the expected 503 from `/api/health`. A later database-configured smoke test returned 200 for `/packages`, `/brochure`, a valid `/delivery/[token]`, and `/api/health`; `/pricing` returned 308 and revoked/unknown delivery tokens returned 404. `robots.txt` and a database-aware `sitemap.xml` were added, with `SITE_URL` as the canonical origin.
- A fresh disposable PostgreSQL 18.6 cluster then applied all six migrations and verified the main journeys: owner Studio routes returned 200; client, project, crew, schedule, call-sheet, deliverable, and quote actions persisted; the accepted quote snapshot locked its totals; content drafts published and rendered on public routes; an inquiry submitted once and converted to one client and project; and private media stayed anonymous-404 until shared, then returned 404 again after revocation. The disposable cluster and test records were removed afterwards. Prisma's transitive `mysql2` and `deepmerge-ts` advisories were then resolved with pinned overrides in `pnpm-workspace.yaml`; `pnpm audit --prod` reports no known vulnerabilities, and a second disposable run confirmed all six migrations still deploy cleanly. A third disposable cluster later applied all seven migrations, including milestones, departments, external delivery, and media derivatives; the new public routes were smoke-tested and the cluster was removed. A fourth cluster applied all eight migrations, including quote discounts.
- S12 is partially started: `/api/health`, security headers, disabled framework disclosure, environment/ignore updates, and route/permission review during implementation. Staging verification, accessibility/performance/SEO review, logging, backups, restore/rollback, and a lint gate remain.
- Media storage uses private Vercel Blob with direct browser uploads, a permission-checked token endpoint, metadata validation, five-minute signed reads, and private image derivatives when `ffmpeg` is available. Production requires a connected private Blob store. SMTP notification delivery is implemented; production Gmail credentials and recipient are still required. No production deployment is connected.
- The owner supplied 47 crew/event photographs in `public/` and requested a public-experience expansion. The brochure, packages page, full capability list, persisted theme toggle, selected photography/slideshow, budget planner, milestones/dashboard, multi-department review, external delivery links, and studio derivatives are now built. Publication approval and rates remain owner gates; staging deployment is next.
- 22 October 2026 — homepage media overhaul: the supplied library grew to ~99 photographs and 7 vertical clips, so the curated set is now generated by script. `scripts/generate-site-media.py` produces responsive WebP derivatives in `public/media/on-set/` (12-image on-set photo story used by the homepage, services, team, and brochure) and `public/media/site/` (hero, intro mosaic, work-mosaic frames, crew strip). `scripts/generate-reel-videos.sh` re-encodes three selected vertical clips (`IMG_5250`, `IMG_5251`, `IMG_5266`) to 720×1280 MP4/WebM with brightest-frame posters in `public/videos/reel-{1,2,3}`; `IMG_5268` was rejected because it was recorded sideways with no rotation metadata. The homepage now shows the mandated `hero.jpg` as the hero photo, a five-frame intro mosaic, a real three-clip showreel (user-controlled, MP4+WebM, poster list), the on-set story with auto-advance that respects reduced-motion/hover/manual interaction, photo-backed "selected work" cards explicitly labelled SET & STUDIO LIBRARY · NOT CLIENT WORK until approved portfolio covers exist, and a crew strip behind the team preview. `npx tsc --noEmit` and `pnpm build` pass; all stills/clips serve 200. Owner gates unchanged: publication approval, credits/watermark treatment, rates, contact details, social URLs.
- 22 October 2026 (second pass, owner feedback): the showreel became a Facebook-stories-style horizontal strip (`stories-row`, scroll-snap, side-by-side portrait cards with posters and durations, tap-to-play, no autoplay). The "selected work" section no longer falls back to unnamed placeholders: `features/portfolio/projects.ts` now carries the owner-named event coverage drafts — TPH Worship Experience, KPR Pistis Place 26, Halleluyah Experience 10, Living Portals, Eucharistia, Camp Champion — each with a curated cover frame (`eventCovers` in `features/media/site-images.ts`; `work4` derivatives were added to the generator). The homepage showed the first three photo-backed cards; `/work` renders all six in the dev/draft preview until portfolio entries are published, and the PortfolioBrowser now renders cover photos behind its cards. Admin can add further work at `/studio/content` (portfolio entries support title, slug, categories, cover image URL, media, credits, publication state). The owner-supplied TikTok URL (`https://www.tiktok.com/@dynamicteam0?lang=en`) is wired in as the first official channel on `/socials`, the homepage social fallback, and the footer; other channels stay labelled pending. `npx tsc --noEmit` and `pnpm build` pass; homepage, `/work`, and draft case-study previews were smoke-tested in both no-database production and dev modes. (The homepage preview was later expanded to all six cards; see the fourth pass below.)
- 22 October 2026 (fourth pass, owner copy/contacts): owner-supplied brand copy is integrated — hero and hero-art overlay use the tagline "Ideas into impact.", the intro follows the agency description (media production, visual storytelling, branding, digital marketing, strategic consultancy, professional training), the dark section lists the five pillars (Excellence, Innovation, Creativity, Quality, Delivery) from `features/content/contact.ts`, the team section states the team currently has 30 members, and the metadata title describes D Team as a dynamic creative agency with the same tagline. All six event drafts now appear on the homepage (`/ 06` numbering) as the owner chose to show everyone. Owner-supplied phone/WhatsApp `+234 701 067 6567` is wired as `tel:+2347010676567` and `https://wa.me/2347010676567` (preset "Hello D Team…" message) via constants in `features/content/contact.ts`: WhatsApp and Call buttons in the homepage contact section, WhatsApp/Call/TikTok links in the footer, and a fixed floating WhatsApp button (`components/public/whatsapp-fab.tsx`) on all public pages, styled with WhatsApp green and icon-only on mobile. The site header is now sticky (`position:sticky;top:0;background:var(--paper)`) with `[id]{scroll-margin-top}` so anchored navigation clears it; brochure cover updated to the new tagline. The README documents the first administrator email (`junmanpi@gmail.com`) with the password deliberately kept out of the repo, entered interactively via `pnpm auth:create-admin`; further admin emails may follow. `npx tsc --noEmit` and `pnpm build` pass; no-database production smoke (public routes 200, `/` shows tagline/pillars/contacts/six events, `/api/health` 503) and dev-mode checks (`/work` six drafts case-study 200) passed. Contact/address wording, publication approval, credits/watermark treatment, and rates remain owner gates.
- 23 October 2026 (UI/UX motion pass): `UI_UX_PLAN.md` was written from a dg-cinema.com pattern study and executed as three phases. Phase 0 moved the public site to a dark-first token palette (light theme preserved behind the toggle) with a gradient-clipped hero; the dead-toggle report was traced to a stale dev tab, not the component: Next 16 blocks HMR from `127.0.0.1`, so `allowedDevOrigins: ["127.0.0.1", "localhost"]` was added and the dev server restarted. The toggle was then verified interactively (dark → light → persists across `/work`). Phase 1 added `components/public/motion.tsx` (two-row services marquee with Pause/Play, live Lagos clock), `corners.tsx` brackets, pulse dots/tick rows, header blur-on-scroll, staggered reveals, and hover language; reduced-motion was verified to stop the marquee, hide the duplicate track, and make the strip scrollable. Phase 2 rebuilt the homepage: hero corner brackets and scroll index, six events as two stacked offset columns, pillars as a rotated two-column cluster with outlined numbers, a typographic statement with inline photo chips, the 16-service marquee, crew brackets, and a contact clock bar. Content corrections: Camp Champion → VC Townhall Meeting; services expanded 13 → 16 (Social media build & management, Network engineering, Software & systems engineering). `npx tsc --noEmit` and `pnpm build` pass; homepage, `/services`, and `/work/camp-champion` return 200 with the new content. The team roster build remains owner-gated on ambiguous portrait filenames.
- 23 October 2026 (phase 3, work/story pass): `/work` gained a staggered two-column grid, pointer-driven cover parallax, and per-card quick-look overlays; case studies now open their logline/synopsis in a reusable `StoryOverlay` dialog (scroll lock, Esc/backdrop close, focus return, Tab trap) and use layered cover frames with corner brackets plus gradient headings. The mobile menu became a full-screen overlay above the WhatsApp FAB, scroll reveals moved into the public layout (so `/services`, `/packages`, and `/brochure` animate), and service rows/package cards got hover states. `npx tsc --noEmit` and `pnpm build` pass; `/work`, a draft case study, `/services`, `/packages`, and the mobile menu were verified in a real browser.
- 23 October 2026 (phase 4, page passes): `/socials` gained staggered reveal rows, an official-status pulse, and a WhatsApp CTA; `/journal` gained a themed empty state and hover-lift cards; a branded `app/not-found.tsx` with corner brackets, gradient headline, home/work links, and `noindex` now serves unknown URLs (verified HTTP 404). Mobile padding was corrected where the WhatsApp FAB met short page content, and the header now hides its CTA and toggle label between 761–1080px so the wordmark no longer wraps on tablets.
- 23 October 2026 (phase 5, chrome polish): the public header shows a live Lagos clock at ≥1180px; the footer is now a responsive grid with icon links for TikTok, WhatsApp, and phone; and the WhatsApp FAB fades out of the tab order when the footer is visible so it never covers footer content. Tablet headers between 761–1080px hide the header CTA and toggle label to keep the wordmark on one line.
- 23 October 2026 (phase 6, motion system): installed the Impeccable design skill for OpenCode and applied its `animate` workflow. Added a shared easing/duration token scale, route-change page enter via `app/(public)/template.tsx`, a choreographed homepage hero (shutter title, frame wipe, stamp, index), shutter-mask page H1/H2 reveals, a drawn index rule, a circular theme wipe using View Transitions, staggered mobile-menu links, a header scroll-progress hairline, and consistent press feedback. Replaced gradient display text with solid ink/acid, themed scrollbars and caret, and kept a no-travel reduced-motion path. `npx tsc --noEmit`, `pnpm build`, and the Impeccable detector all pass.
- The active next step is staging review of the new modules and S12 hardening. Staging/production database selection and the owner decisions in [DELIVERY_SLICES.md](./DELIVERY_SLICES.md) remain release gates.

## Latest owner request · 21 October 2026

Deliver a public site that feels like the real D-Team, not a placeholder shell:

- Brochure and a page explaining the different packages.
- Capability coverage for photography, cinematography, content creators, social media managers, livestreamers, production directors, graphics/motion design, sound, lighting, LED/video, front of house, and in-house production.
- Use the supplied `public/DSC*.jpg` photography via optimized derivatives, with slides/storytelling and real on-set imagery. (Skipped because the library was expanded/renamed; the curated set is drawn from the full supplied library, not just DSC*.)
- A theme toggle that works and persists.
- Budget input that produces a realistic planning snapshot without inventing approved rates.
- Then milestones/dashboard, multi-department review, external deliveries, optimized studio derivatives, accessibility/performance/SEO, and final verification.

Public photography and package rates remain subject to owner approval. Build the experience so approved assets and rates can replace draft labels without a redesign.

## Goal

Build D-Team as two connected experiences under one identity:

- **D-Team Studio:** a cinematic, mobile-friendly public site that presents work, services, people, pricing, social links, and a clear inquiry/booking path.
- **D-Team Production:** a private workspace for staff to manage inquiries, projects, crew, calendars, quotes, media, deliverables, and public website content.

The public experience should establish the brand and win work. The private experience should support production work for a team of 30+ people. Both use a shared design language and authoritative content/data model, with separate navigation and access rules.

## Starting point and audit findings

YAW is a Next.js 15.2.4 / React 19 / TypeScript / Tailwind app plus a separate Express/PostgreSQL/Prisma service. It currently serves Young Africa Works registration, scheduling, event booking, and a DP banner generator. It has useful UI primitives, but no D-Team portfolio, service CMS, project operations, roles, sessions, crew model, quotes, or media permissions.

The YAW repository remains unchanged except for its audit report. D-Team will be a separate project in this folder. Reuse patterns and components selectively after review; do not rename YAW in place or copy its generated clients and legacy data model wholesale.

See the detailed source findings in [YAW repository audit](../YAW/REPOSITORY_AUDIT.md).

## Decisions already set by the brief

- Brand evolves to D-Team.
- Visual direction is cinematic, premium, and motion-led.
- Release includes a public website and private production platform.
- Publish packages where appropriate and support custom quotations.
- Include an admin dashboard/CMS in the first release.
- Use a coherent production process story: idea → crew → live execution → finished work.
- Motion must respect reduced-motion preferences, mobile performance, keyboard access, and user-controlled video playback.

## Decisions to resolve during discovery

These affect content and implementation but need not block scaffolding or design-system work:

1. **Portfolio assets:** which D-Team photos, films, logos, team portraits, and client marks are approved for public use; who owns usage rights?
2. **YAW continuity:** should YAW remain independently deployed, be archived, or have selected functionality moved into D-Team? The initial plan preserves it untouched.
3. **Pricing:** which packages and starting prices are public, and which services are quote-only?
4. **Staff roles:** who can manage content, projects, finances, crew, and settings? Define least-privilege roles before production data is added.
5. **Deployment and operations:** target domain/host, database provider, object storage/CDN, backup retention, and alerting.
6. **Inquiry process:** required fields, response expectations, notification recipients, and any approval stages.

## Target route map

### Public

- `/` — cinematic homepage
- `/work`, `/work/[slug]` — portfolio with category filters and case studies
- `/films`, `/photography`, `/livestreams`, `/design` — curated discipline views (may be category-filtered views, not separate data stores)
- `/services`, `/services/[slug]`, `/pricing`, `/request-quote`
- `/team`, `/team/[slug]`
- `/journal`, `/journal/[slug]`
- `/socials`
- `/events`, `/events/[slug]`, `/g/[shareToken]` — event collections and explicitly shared galleries
- `/contact`, `/book`, `/inquiry-received`, `/privacy`, `/terms`

### Private

- `/studio` — overview
- `/studio/projects`
- `/studio/calendar`
- `/studio/crew`
- `/studio/clients`
- `/studio/quotes`
- `/studio/media`
- `/studio/deliverables`
- `/studio/content`
- `/studio/social`
- `/studio/reports`
- `/studio/settings`

Protect all private routes and APIs on the server. Client-side route hiding is not authorization.

## Recommended project architecture

Start with a single Next.js App Router application in this D-Team folder, organized by domain and shell. Keep the public site and authenticated studio in separate route groups/layouts. Use one server-only data access layer and one authoritative PostgreSQL schema. Avoid a second Express service unless an identified deployment or integration need requires it.

```text
D-Team/
  app/
    (public)/                 public routes and public layout
    (studio)/studio/          private routes and authenticated layout
    api/                      server route handlers
  components/
    public/                   hero, work grid, motion/reveal components
    studio/                   shell, tables, forms, operational UI
    ui/                       shared accessible primitives
  features/
    auth/ clients/ projects/ crew/ calendar/ quotes/
    media/ deliverables/ cms/ inquiries/ reporting/
  lib/
    auth/ db/ validation/ storage/ permissions/
  prisma/                     schema + migration history
  public/                     approved logos, stills, posters, fonts
  docs/                       decisions, runbook, architecture
```

Retain the YAW stack direction initially (Next.js/React/TypeScript/PostgreSQL/Prisma) because the current Next app built successfully. Before production use, pin loose dependency declarations, consolidate package ownership, align Prisma schema and migrations, remove sensitive logs, and restore type/lint build checks. Choose one primary animation library only after the first motion components are designed; CSS handles basic transitions.

## Phased implementation plan

### Phase 0 — Project foundation and discovery

- Create the D-Team app in this folder without modifying YAW.
- Record the architecture decisions and local setup instructions.
- Confirm approved brand/media assets, YAW continuity, pricing inputs, staff roles, and deployment targets.
- Establish the app shell, design tokens, typography, color, spacing, responsive breakpoints, and accessible primitives.
- Set up environment variable examples with no real secrets.

**Exit gate:** clean install and baseline build; route shells render on mobile and desktop; no YAW data or credentials copied into D-Team.

### Phase 1 — Public D-Team Studio

- Build navigation, footer, homepage sections, and inquiry CTA.
- Create structured portfolio, category, team, service, pricing, and social content models.
- Deliver work index/detail, services, team, pricing, contact/inquiry, and legal pages.
- Add showreel with poster and user-controlled playback; load heavy media only when needed.
- Add cinematic reveal, heading reveal, restrained parallax, staggered grids, and navigation transitions as reusable motion components.
- Add reduced-motion behavior and keyboard/touch access.
- Populate only with assets approved for D-Team use; label temporary content clearly during development.

**Exit gate:** public pages and inquiry flow work across screen sizes; content does not depend on hardcoded duplicated gallery datasets; media is optimized and rights-cleared.

### Phase 2 — Backend, identity, and admin CMS

- Create the authoritative schema and migration history for users/roles, clients, inquiries, portfolio, services, pricing, people, media, and publication state.
- Implement authentication, server-side authorization, session handling, and audit events.
- Implement admin workflows for editing, previewing, publishing, and unpublishing content.
- Implement private media storage and explicit public/client-share rules.
- Validate all inputs at the server boundary; rate-limit public inquiry endpoints; use server-only secrets.

**Exit gate:** CMS can maintain public content without code edits; role checks are enforced server-side; private media cannot be fetched without authorization.

### Phase 3 — Production management

- Add projects, client records, crew directory and skills, availability, assignments, schedules, and call sheets.
- Add quote builder with packages, line items, approval state, and accepted quote snapshots.
- Add deliverable tracking, review status, and secure delivery links.
- Add useful overview, notifications, operational reporting, and audit history.
- Keep dashboard motion subtle and tied to action feedback.

**Exit gate:** staff can take an inquiry through quote, project setup, scheduling, crew assignment, and delivery with persisted, permission-checked records.

### Phase 4 — Release hardening

- Restore TypeScript and lint checks in the production build.
- Verify auth boundaries, role matrix, uploads, sharing tokens, and data access.
- Verify responsive layouts, keyboard navigation, focus states, contrast, reduced motion, and forms.
- Review performance budgets, image/video loading, caching, SEO, metadata, and accessibility.
- Configure production secrets, backups, monitoring, error reporting, and a recovery runbook.
- Run end-to-end release checks against a staging database and deployment.

**Exit gate:** production configuration and recovery process are documented; all launch criteria below pass.

### Later milestone — Client portal

Once staff workflows are stable, add client access to approve quotes, review selected deliverables, and access explicitly shared galleries. Keep internal budgets, crew data, and other clients’ projects inaccessible.

## Initial domain model

Build toward these connected entities; finalize fields and relations before the first database migration:

- `User`, `Role`, `Permission`, `AuditEvent`
- `Client`, `Inquiry`
- `Project`, `ProjectCategory`, `ProjectMember`, `CrewAssignment`, `ScheduleItem`
- `TeamMember`, `Skill`, `Availability`
- `Service`, `PricePackage`, `Quote`, `QuoteLine`
- `MediaAsset`, `Gallery`, `ShareGrant`, `Deliverable`
- `SocialPost`, `JournalPost`, `PageContent`

Use explicit publication states and visibility scopes. Default media to private. Model published public portfolio as a controlled view of project data rather than a separate duplicated content store. Snapshot accepted quote amounts so later package changes cannot rewrite history.

## Top risks and mitigations

| Risk | Mitigation |
|---|---|
| Rebuilding or modifying YAW unintentionally | Keep D-Team as its own folder and preserve YAW source/deployment |
| No cleared D-Team media | Gather approved assets before final homepage composition; build layouts that can accept replacements |
| Scope overload in first release | Sequence public site → CMS/auth → operations; defer client portal |
| Private media exposure | Private-by-default storage, signed/authorized access, explicit sharing grants |
| Public CMS and portfolio drift | One authoritative model with publication states |
| Access rules added late | Define role matrix and enforce at server/API boundary before loading production records |
| Cinematic motion hurts mobile usability | Lazy media, reduced-motion mode, short effects, mobile performance checks |
| Dependency/build issues inherited from YAW | Lock versions, reconcile one package/deploy boundary, restore type/lint gates |

## Launch definition

- Public routes work on mobile and desktop and have accessible navigation and forms.
- Public portfolio, services, team, pricing, and social content are manageable in the CMS.
- Inquiries are validated, persisted, and visible only to authorized staff.
- Projects, quotes, schedules, crew assignments, and deliverables persist correctly.
- Media defaults private; public and client-shared access follows explicit policy.
- Role checks are enforced and verified server-side.
- Motion respects reduced-motion settings and does not block navigation or forms.
- Large images/video use optimized sources, responsive sizes, posters, and lazy loading.
- Production configuration, logs, backups, monitoring, and recovery procedure are documented.
