# D-Team delivery slices

This is the working execution tracker for the D-Team build. Each slice should leave a usable increment, update this file, and meet its acceptance checks before being marked complete. Keep YAW intact. Do not start a dependent slice while its prerequisite is unresolved unless the dependency is explicitly marked as deferred.

**Last updated:** 27 October 2026
**Status key:** `Not started` · `In progress` · `Waiting on input` · `Complete`

## Release path

| ID | Vertical increment | Depends on | Status |
|---|---|---|---|
| S0 | Runnable D-Team foundation | — | Complete |
| S1 | Public shell and responsive navigation | S0 | Complete |
| S2 | Homepage story and approved media | S1, asset decision | In progress (image/video overhaul from the expanded library built 22 Oct; publication approval pending) |
| S3 | Work index and case study | S1; project content deferred pending approval | In progress |
| S4 | Services, packages, and inquiry submission | S0; public pricing deferred pending approval | In progress (Gmail SMTP notification delivery and staff retry built; environment and owner launch gates pending) |
| S5 | Data foundation and authentication | S0; hosting/roles decision for deployment | In progress (local foundation verified; production decisions pending) |
| S6 | Admin CMS for public content | S5 local auth foundation | Complete (verified on disposable database) |
| S7 | Clients and project lifecycle | S5 | In progress (core + milestones/dashboard built; staging review pending) |
| S8 | Crew, availability, schedule, and call sheets | S7 | In progress (core + multi-department review built; staging review pending) |
| S9 | Quotes and deliverables | S7 | In progress (core + external delivery links + discounts built; staging review pending) |
| S10 | Media library, event galleries, and sharing | S5 | In progress (private Vercel Blob client uploads, permission-scoped access, five-minute signed reads, and image derivatives built; Blob store setup pending) |
| S11 | Team, journal, and social publishing | S6 | Complete (verified on disposable database) |
| S12 | Release hardening and operations | S3–S11 | In progress (build and TypeScript pass; staging, backup/restore, monitoring, accessibility/performance review pending) |

## Outstanding scope · 21 October 2026

The owner has supplied 47 crew/event photographs in `public/` and asked for the public site to carry the real production story, not just labelled placeholders. The public-experience expansion is implemented; the remaining production gaps and release gates are next.

### 1. Public experience

- [x] Turn `/pricing` into a clear packages page (or add `/packages`) covering the different ways to work with D-Team, with approved names/rates only. Until rates are approved, label all package copy as draft and keep the custom-quote path.
- [x] Add a budget planner: visitors enter an amount and receive a planning snapshot/shortlist. It may only match approved package amounts; it must not invent rates or promise a quote.
- [x] Add a print-ready brochure route and print stylesheet covering capabilities, process, selected work, crew, and inquiry CTA. A downloadable PDF is deferred until a PDF dependency or owner-approved export path is chosen.
- [x] Expand the capability catalog to the full production team: photography, cinematography, content creators, social media managers, livestreamers, production directors, graphics/motion design, sound, lighting, LED/video, front of house, and in-house production/crewing.
- [x] Generate responsive WebP derivatives from the supplied `public/DSC*.jpg` originals and use only selected derivatives on public pages. Keep originals out of page payloads; record alt text and image credits/approval status.
- [x] Add a photo story/slideshow and on-set gallery using the supplied images. The photo story advances on a 6.2-second loop with a pause control, arrow/thumb navigation, live announcements, and reduced-motion support. Showreel clips remain click-to-play.
- [x] Implement a real, persisted light/dark theme toggle. The current root layout has no theme initialization, and YAW only hardcodes dark mode, so it is not a reusable implementation.
- [x] Replace homepage abstract-only media where appropriate, add real crew imagery to team/service pages, and keep every pending asset explicitly labelled.
- [ ] Complete a public accessibility/performance/SEO pass after imagery is added: image dimensions/srcset, focus order, motion, metadata, sitemap/robots, and local-only image weight.

### 2. Production platform gaps

- [x] S7: add project milestones and a useful Studio overview dashboard.
- [x] S8: support crew membership in multiple departments and add the department/role review flow.
- [x] S9: add quote discounts; external deliverable delivery links with expiry/revocation are built.
- [x] S10: use private Vercel Blob for Studio uploads, add optimized image derivatives and thumbnails, and authorize reads before issuing short-lived signed URLs. A connected production Blob store remains a release gate.
- [ ] S12: finish staging verification, accessibility/performance/SEO review, logging/monitoring, backup/restore/rollback, and the Next.js security recheck.

### 3. Owner decisions still blocking launch

- [ ] Approve which supplied photographs may be published, and confirm photographer credit/watermark policy.
- [ ] Approve package names, rates, inclusions, and whether any rates are public.
- [ ] Approve service/capability descriptions, brochure copy, and legal/privacy wording.
- [x] Phone/WhatsApp contact supplied (`+234 701 067 6567`) and wired site-wide (homepage contact section, footer, floating WhatsApp button); TikTok supplied and wired. Gmail SMTP is implemented; notification recipient, privacy/retention policy, postal/contact address, and other social URLs remain to confirm.
- [ ] Select production database/hosting, connect the Vercel Blob store, configure backup retention, and confirm final staff role policy.

## Disposable verification run · 21 October 2026

A fresh user-owned PostgreSQL 18.6 cluster on `127.0.0.1:55432` verified the committed migration history and the new modules without touching YAW or any shared database. A later disposable cluster on port 55434 re-applied all seven migrations and smoke-tested the new public routes; both clusters were removed after verification.

- All six migrations applied cleanly with `prisma migrate deploy`, creating 35 tables including the platform-module tables.
- `auth:create-admin` created a disposable platform administrator; a disposable D-Team Production organization and owner membership were added.
- The owner session returned 200 for every Studio route: overview, inquiries, clients, projects, crew, calendar, quotes, deliverables, media, all content editors, and content history.
- Server-action flows created a client, project, crew profile, project assignment, schedule item, private call sheet, deliverable, quote with a line item, and an accepted quote. The accepted snapshot preserved `Q-2026-0001` at a total of 250,100 minor units after acceptance.
- Content flows created and published a service, team profile, journal entry, and social link. Their public routes plus the service detail, team detail, and journal detail returned 200 and rendered the published records.
- A public inquiry POST returned 201 and persisted once; the staff inbox rendered it and conversion created one linked client and project with the inquiry marked `converted`.
- A private media upload was readable by an authorized staff session (200) and not readable anonymously (404). A share token made it readable and set `Cache-Control: private, no-store`; the shared gallery returned 200; revocation made both the token media request and gallery return 404.
- The disposable server, cluster, and test records were removed after verification. This run did not re-test the full role matrix or production storage/CDN behavior.

## Slice definitions

### S0 — Runnable D-Team foundation

**Deliver:** an independent Next.js app in this folder, pinned runtime dependencies, reproducible lockfile, local setup instructions, environment example, and a clean baseline build. Keep generated files and credentials out of source control.

**Acceptance:** a fresh checkout can install from the lockfile and start locally; the homepage route renders; metadata is D-Team branded; no YAW code, generated clients, data, or secrets are required to run it.

**Completed 14 October 2026:** pinned dependencies and generated `pnpm-lock.yaml`; `pnpm build` passed with Next.js 16.4.0, and the homepage prerendered. Next updated `tsconfig.json` to use `react-jsx` and include `.next/dev/types/**/*.ts`. `pnpm audit --prod` reports no known vulnerabilities. The official Next.js site still lists the October 14 out-of-band security update as upcoming and has not published its full advisory or patched versions at the time rechecked today. Treat the present lockfile as a development baseline only; recheck and pin the patched release before deployment. See [Next.js security update notice](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026).

### S1 — Public shell and responsive navigation

**Deliver:** shared public header/footer, mobile menu with keyboard/focus behavior, active route styling, typography/color/spacing tokens, and public layout boundaries that will not be reused for private `/studio` routes.

**Acceptance:** nav works by keyboard, touch, and pointer; mobile menu opens/closes accessibly; page layout works at narrow and wide viewports; focus and contrast are visible.

**Completed 14 October 2026:** added a shared public layout, extracted header/footer, skip link, responsive menu disclosure, Escape-to-close with focus returned to the trigger, section-aware active state, and focus-visible styles. Moved the homepage under the public route group so future `/studio` routes can have an independent shell. Removed the remote Google Fonts stylesheet import so the initial shell has no third-party font request. Added the Next-generated `AGENTS.md` guidance for this framework version. `pnpm build` passed with TypeScript and static prerender. Browser review at desktop default and 390×844 confirmed the desktop nav, mobile menu open/close, Enter/Escape keyboard controls, link navigation/close, and no horizontal overflow (390px viewport; 375px document scroll width). The default viewport was restored after review.

### S2 — Homepage story and approved media

**Deliver:** hero, user-controlled showreel, selected-work preview, production process, capabilities, team introduction, pricing preview, social links, and closing inquiry CTA. Use approved D-Team footage/photos; keep posters responsive and defer video loading until requested/visible.

**Acceptance:** every section has real D-Team content or is clearly marked as draft; no YAW assets are presented as D-Team work; reduced-motion users receive a calm static experience; video is never required to understand or navigate the page.

**In progress 14 October 2026:** built homepage sections for the showreel, selected work, team, services, pricing preview, social links, and closing contact area. With the owner choosing placeholders for now, every unapproved area is labelled: portfolio cards are sample placeholders explicitly marked as not client work; team portraits/bios, package rates, social URLs, and contact destination are pending. The showreel uses native user-controlled video playback when an approved source and poster are configured; it otherwise shows a labelled placeholder without a fake play control. Added a reusable, one-time scroll reveal observer for the hero and selected content, with no-JavaScript visibility and reduced-motion handling. Removed the invented `hello@dteam.studio` mail links. Updated the public team navigation target. Added `.env.example` entries for the optional showreel source/poster. `pnpm build` passed after these changes (Next.js 16.4.0, TypeScript, static prerender). Browser review confirmed section content in the accessibility tree, reveal activation while scrolling, and no horizontal overflow at the available 613px viewport. S2 remains in progress until playback and contact destinations are configured and the placeholder content is cleared or replaced.

**Updated 21 October 2026:** generated 48 responsive WebP derivatives (480/960/1600 widths) from 16 selected supplied photographs under `public/media/on-set/` and added the `features/media/on-set-images.ts` manifest. Added a user-controlled `PhotoStory` with keyboard/reduced-motion handling, an on-set masonry grid, and integrated selected imagery into the homepage, team, services, and brochure routes. Added a persisted `data-theme` toggle scoped to the public shell, plus dark-theme styles for public cards, forms, and inquiry pages. `npx tsc --noEmit` and `pnpm build` passed. Original `public/DSC*.jpg` files remain outside page payloads; publication approval and photographer credit/watermark policy still block S2 completion.

**Updated 22 October 2026 (media overhaul from expanded library):** the owner expanded `public/` to ~99 photographs and `public/videos/` to 7 vertical clips. Imagery is now fully script-generated and visually curated:
- `scripts/generate-site-media.py` writes responsive WebP derivatives into `public/media/on-set/` (12-image on-set photo story — cameras, main camera bank, lighting/visual desk, screen rigging, sound consoles, in-house control room, live-edit/laptop stations, gear check) and `public/media/site/` (hero.jpg derivatives capped at the 1002px master, a five-frame intro mosaic, three work-mosaic frames, and a three-frame crew strip).
- `scripts/generate-reel-videos.sh` re-encodes three selected vertical clips (`IMG_5250` 15s, `IMG_5251` 28s, `IMG_5266` 36s) to 720×1280 H.264/AAC MP4 (faststart) plus VP9/Opus WebM with brightest-frame posters in `public/videos/reel-{1,2,3}`. `IMG_5268` was rejected after visual review: it was recorded sideways with no rotation metadata. `IMG_5265` carries a burned-in third-party title overlay and was also left out.
- Homepage: the abstract hero art is now the mandated `hero.jpg` photo with the original overlay typography retained; a five-frame intro mosaic (drone, gimbal, studio desks, drone prep, media table) follows the intro copy; the showreel is a real three-clip selector (MP4+WebM, poster, user-controlled playback, no autoplay); the photo story advances every 6.2 seconds with a visible pause control and honors `prefers-reduced-motion`; hero and active story photos have slow ambient drift; selected-work cards show library frames with a scrim, explicitly labelled SET & STUDIO LIBRARY · NOT CLIENT WORK, and use published portfolio `coverImageUrl` when present; an empty team preview now shows a crew photo strip behind the label.
- New manifests: `features/media/on-set-images.ts` (12 story images with verbatim alt text), `features/media/site-images.ts` (hero/intro/work/crew), `features/media/showreel-clips.ts`. `NEXT_PUBLIC_DTEAM_SHOWREEL_*` env vars were removed from `.env.example`.
- `npx tsc --noEmit` and `pnpm build` passed; a production smoke test returned 200 for the homepage, work, services, team, brochure, packages, robots, and sitemap, 200-with-sizes for all stills and clips, and the expected DB-less 503 for `/api/health`. Publication approval/credits, rates, contact details, and social URLs remain owner gates for S2.

**Updated 22 October 2026 (owner feedback pass):**
- Showreel redesigned as a Facebook-stories-style strip: `stories-row` with scroll-snap portrait cards side by side, horizontally scrollable, poster + duration per card, tap-to-play (no autoplay). Replaces the previous selector layout.
- "Selected work" no longer falls back to unnamed placeholders: owner-named event coverage drafts in `features/portfolio/projects.ts` — TPH Worship Experience, KPR Pistis Place 26, Halleluyah Experience 10, Living Portals, Eucharistia, Camp Champion — each with a curated cover from `eventCovers` (`features/media/site-images.ts`); `work4` derivatives added to `scripts/generate-site-media.py`. Homepage shows the first three photo-backed cards; `/work` renders all six as draft previews via the PortfolioBrowser, which now paints cover photos behind its cards. Staff can add more work in the Studio CMS at `/studio/content` (cover image URL, media, credits, publication state all persisted in PostgreSQL).
- TikTok supplied officially (`https://www.tiktok.com/@dynamicteam0?lang=en`): listed on `/socials` (with "other channels pending" note), homepage social fallback, and footer.
- `npx tsc --noEmit` and `pnpm build` pass; smoke-tested in no-database production and dev modes (homepage events+stories, `/work` six named drafts with covers, draft case-study route 200).

**UI audit follow-up · 24 October 2026:** the homepage now gates hard-coded portfolio drafts behind development or authorized preview; production with no published CMS work renders an empty state. Corrected the VC Townhall Meeting draft slug/cover key and the reusable story dialog's unique accessible title ID and keyboard wrap. Motion now stays present through the hero and photo story, with a clear slideshow pause control and reduced-motion behavior. `pnpm exec tsc --noEmit` and `pnpm build` pass; live browser review confirmed the gallery advances, pauses, and holds its frame, and a no-database production run confirmed the homepage has no draft case studies. Narrow/wide viewport and cross-browser/accessibility checks remain.

**Updated 22 October 2026 (owner copy/contacts pass):**
- Owner brand copy integrated: hero/H1, hero-art overlay, footer promise ("IDEAS INTO IMPACT."), metadata title, and the `/brochure` cover now carry the "Ideas into impact." tagline; the intro section uses the supplied agency description (media production, visual storytelling, branding, digital marketing, strategic consultancy, professional training); the dark section lists the five pillars (Excellence, Innovation, Creativity, Quality, Delivery) from `features/content/contact.ts`; the team aside/placeholder state the team currently has 30 members.
- All six event drafts now appear on the homepage selected-work section (previously three), with `{number} / 06` numbering — the owner asked to show everyone.
- Owner contacts wired: phone/WhatsApp `+234 701 067 6567` (`tel:+2347010676567`, `https://wa.me/2347010676567` with a preset "Hello D Team…" message) live in `features/content/contact.ts`; the homepage contact section shows WhatsApp and Call buttons plus WhatsApp/Call/TikTok lines in the contact foot; the footer repeats WhatsApp/Call links; a fixed WhatsApp floating button (`components/public/whatsapp-fab.tsx`, WhatsApp-brand green, icon-only under 760px) is rendered from `app/(public)/layout.tsx` on every public page.
- Site header is sticky (`position:sticky;top:0;background:var(--paper)`), and `[id]{scroll-margin-top:110px}` (84px mobile) keeps anchored sections clear of it.
- README documents the first administrator email (`junmanpi@gmail.com`); the password is entered interactively via `pnpm auth:create-admin` and deliberately not stored in the repository, docs, or `.env.example`.
- `npx tsc --noEmit` and `pnpm build` pass. Smoke: no-DB production — `/`, `/work`, `/socials`, `/packages`, `/brochure`, `/request-quote`, `/services/*` all 200 with tagline/pillars/contacts present; `/api/health` expected 503. Dev mode — `/work` lists all six named drafts and `/work/tph-worship-experience` returns 200. Post-publication contact/address wording, credits/watermark treatment, rates, and more admin emails remain owner gates.

### S3 — Work index and case study

**Deliver:** `/work` with category filters, a project detail route, media sequence, role/crew credits where approved, and related work. Model categories as tags so one project can appear in multiple collections.

**Acceptance:** filter controls are keyboard-operable and have an all-projects state; each card opens a meaningful detail page; unpublished/private projects are never rendered publicly.

**In progress 14 October 2026:** added `/work` category filters and a case-study route backed by the shared PostgreSQL portfolio registry. Staff can create and edit drafts in the Studio CMS; public queries are scoped to the D-Team Production organization and published records only. A draft is published only after an authorized staff member confirms content and media approval; publication changes and edits are written to audit events. Draft previews remain development-only, unknown/unpublished production slugs return 404, and `/work` is noindex while empty. The homepage selected-work cards use the same portfolio source when entries exist and retain explicit placeholders otherwise. A clean disposable PostgreSQL 18.6 database applied all five migrations with `migrate deploy`. Production HTTP review with disposable records returned 200 for a published case study and 404 for a draft; `/work` showed only the published record. The `pnpm prisma generate`, `pnpm db:validate`, `pnpm auth:schema-check`, and `pnpm build` checks passed after the implementation. Earlier responsive/browser checks still cover the filter layout and empty/draft states. S3 remains in progress until approved project content is supplied and reviewed; no client work is represented by the draft records.

### S4 — Services, packages, and inquiry submission

**Deliver:** services and service details, public packages/pricing where approved, custom quote route, validated inquiry form, confirmation state, and staff notification path. Persist submissions server-side and expose them only to authorized staff.

**Acceptance:** invalid submissions receive field-level feedback; successful submissions persist once and return a clear confirmation; public requests cannot query internal inquiry/client data; packages and custom quote requests are both supported.

**In progress 14 October 2026:** added a shared draft capability catalog, `/services` and detail pages, `/pricing` with no invented rates, a custom quote inquiry form, confirmation page, size and field validation, same-origin checks, honeypot handling, HMAC-hashed email/IP rate-limit buckets, and a unique submission key for retry-safe persistence. Valid inquiries and audit events are written together to PostgreSQL; raw IP addresses are not stored. Authorized staff can review new requests at `/studio/inquiries`; the sidebar shows the new-request count, and the page enforces `inquiry.read` on the server. The temporary database verification applied all four migrations with `migrate deploy`. Browser submission persisted successfully and reached confirmation; empty-form submission returned field-level errors; a repeated submission key created only one record; the fourth same-email request in the rate window returned 429. Owner access could read the private brief; crew access returned 404; `GET /api/inquiries` returned 405. The 390px quote form layout had no horizontal overflow. `pnpm build`, `pnpm db:validate`, and `pnpm auth:schema-check` passed. `PUBLIC_INQUIRIES_ENABLED` now defaults to false, so public collection stays paused until privacy/contact details are approved. Package names/rates, final service descriptions, privacy contact and retention policy, and any email notification recipient/provider are still pending. The capability/pricing/quote pages are marked draft and `noindex` until owner review. S4 remains in progress pending those decisions and production configuration.

**Updated 21 October 2026:** added `/packages` with three draft package shapes, the expanded 13-capability catalog, a budget planner that uses approved package amounts only when present (otherwise planning allocations and a custom-quote path), and a print-ready `/brochure` route with print CSS. `/pricing` now permanently redirects to `/packages`; `/request-quote` accepts budget, currency, and service query parameters to prefill the inquiry. No rates, contact details, or legal wording were invented. `npx tsc --noEmit` and `pnpm build` passed.

### S5 — Data foundation and authentication

**Deliver:** authoritative PostgreSQL/Prisma schema and migration history, organization/users/membership roles, session/auth flow, server-side permission helpers, audit events, and deployment environment contract.

**Acceptance:** schema can be created from migrations on a clean database; role checks run at server boundaries; unauthorized access is denied by default; no passwords, tokens, or sensitive request bodies are logged.

**In progress 14 October 2026:** added PostgreSQL/Prisma models and migrations for Better Auth users, sessions, accounts, verification, organizations, memberships, invitations, and audit events. Added Better Auth email/password sign-in with public sign-up disabled, proposed organization roles based on the brief, a server-side permission helper, a private `/studio` shell that redirects unauthenticated visitors, a sign-out redirect, and an environment example. The first administrator is provisioned through Better Auth's interactive CLI; administrator permissions omit impersonation. Public organization creation is disabled; a server-checked setup action creates the single initial D-Team Production organization for the initial administrator, grants the organization owner role, and records an audit event. A signed-in user without workspace membership is redirected out of the Studio shell to an access-pending page. `pnpm install --frozen-lockfile`, `pnpm prisma generate`, `pnpm db:validate`, `pnpm auth:schema-check`, and `pnpm build` passed. On a fresh disposable local PostgreSQL 18.6 cluster, both committed migrations applied successfully; the interactive admin CLI created the test owner; browser sign-in and the workspace setup action created one organization, owner membership, and audit event. Server authorization checks returned owner `project.create` allowed; crew `project.create` denied and `project.read` allowed. Public organization creation returned 403, public sign-up returned 400 and created no user, and a signed-in nonmember received a 307 redirect from `/studio` to `/studio/access-pending`. The disposable cluster and test accounts are not deployment data. S5 remains in progress because no database/deployment target has been selected, the proposed role permissions need owner confirmation, and production environment/operations checks remain outstanding.

### S6 — Admin CMS for public content

**Deliver:** protected editing/publishing for portfolio, services, packages, team bios, journal/social entries, and core page content; draft preview; publish/unpublish; change history.

**Acceptance:** authorized editors can update public site content without code changes; publication state is enforced in server queries; changes and publishers are auditable.

**In progress 14 October 2026:** started the portfolio content domain: `/studio/content` supports permission-checked draft creation, editing, publication confirmation, and unpublishing. Entries are organization-scoped, public work/homepage queries read only published D-Team Production entries, and each mutation is audited. Clean five-migration deployment, Prisma/schema checks, auth schema check, production build, and published-versus-draft HTTP visibility checks passed.

**Updated 21 October 2026:** completed the local CMS implementation. `/studio/content/services` manages services and packages; `/studio/content/team`, `/studio/content/journal`, and `/studio/content/social` manage team profiles, journal posts, and curated social links; `/studio/content/homepage` manages organization site settings; `/studio/content/history` exposes content revisions. Public services, pricing, team, journal, socials, and homepage sections now read published organization-scoped content with static or explicitly labelled fallbacks. Portfolio media sequences, credits, and related work are editable, and all new mutations are permission-checked and audited. `npx tsc --noEmit`, `pnpm db:validate`, `pnpm auth:schema-check`, and `pnpm build` passed on 21 October 2026. The `platform_modules` migration was subsequently applied to a fresh disposable PostgreSQL 18.6 database, and the full content workflow was exercised through the Studio: services/packages, team, journal, social links, publication, public rendering, and revision history all worked. Final role policy and hosting remain production gates.

### S7 — Clients and project lifecycle

**Deliver:** inquiry triage, client records, project creation, scope, status, milestones, assigned project lead, and overview dashboard.

**Acceptance:** staff can convert an inquiry into a client/project without duplicating contact records; every project has a clear state and owner; access follows the role matrix.

**Updated 21 October 2026:** implemented `/studio/clients` with permission-checked client creation and editing, and `/studio/projects` with a project list, project detail, status/scope fields, budget fields, client/service/lead relations, and crew assignment. Staff can update inquiry status and convert an inquiry into a linked client and project without duplicating contact records. Every mutation is organization-scoped, permission-checked, and audited, with project revisions recorded. The production build and TypeScript check passed, and the core flow was verified on a disposable database: inquiry 201, staff inbox 200, conversion created one linked client and project, and the inquiry became `converted`. Milestone tracking and a dedicated overview dashboard were the remaining S7 review items at that point.

**Updated 21 October 2026:** added the `ProjectMilestone` model and migration, milestone create/status/delete actions, project-detail milestone progress and controls, project-list milestone counts, and a permission-aware Studio overview dashboard with KPIs, active projects, milestones, calendar, and delivery queue. The schema and migration were validated on a fresh disposable PostgreSQL 18.6 cluster, and `npx tsc --noEmit` plus `pnpm build` passed. S7 remains in progress pending staging review of the new flows.

### S8 — Crew, availability, schedule, and call sheets

**Deliver:** department/skill profiles, crew availability, project assignments, calendar, production schedule, locations, and shareable internal call sheets.

**Acceptance:** team members can be assigned to multiple departments; schedule changes persist and are visible to permitted staff; private call sheet links cannot reveal unrelated projects.

**Updated 21 October 2026:** implemented `/studio/crew` with crew profiles, skills/departments, and availability records; `/studio/calendar` with project-scoped schedule items, location and notes, upcoming availability, and schedule permissions; and call-sheet generation with a tokenized `/studio/calendar/call-sheets/[token]` view. Call sheets remain private: the token route still requires an authenticated staff session with `schedule.read` and is scoped to the member's organization. Call-sheet details and crew contact fields are only shown to authorized staff. Build and TypeScript checks passed, and a disposable run verified crew creation, project assignment, schedule creation, call-sheet generation, and authorized call-sheet rendering (200). External client-facing call-sheet sharing is intentionally not enabled; the multi-department role review remained after the initial pass.

**Updated 21 October 2026:** added a shared department catalog, persisted `CrewProfile.departments`, multi-select department controls on create/edit, and a department review matrix showing crew coverage. Project member lists now show all assigned departments. The migration was validated on a fresh disposable database, and `npx tsc --noEmit` plus `pnpm build` passed. S8 remains in progress pending staging review.

### S9 — Quotes and deliverables

**Deliver:** quote builder, service/equipment/crew line items, discounts, approval status, accepted quote snapshot, deliverable checklist, review/delivery state.

**Acceptance:** accepted quote totals remain historically stable after package/rate edits; deliverables are linked to the correct project/client and completion is trackable.

**Updated 21 October 2026:** implemented `/studio/quotes` and quote detail with client/project links, currency and notes, line items, automatic totals in minor units, status transitions, and an accepted-quote snapshot that locks further edits and preserves historical totals. `/studio/deliverables` supports project-linked deliverables, review/delivery status, and delivery metadata. Quote and deliverable mutations are permission-checked and audited, with revisions recorded for quote actions. Build and TypeScript checks passed, and a disposable run verified line-item totals, status transitions, the accepted snapshot, and deliverable persistence. Discounts and the completion review remained after the initial pass.

**Updated 21 October 2026:** added fixed-amount quote discounts with an optional label, subtotal clamping, recalculation on line changes, locked-quote protection, and discount fields in the accepted snapshot. The `quote_discounts` migration was applied on a fresh disposable PostgreSQL 18.6 cluster with all eight migrations. `npx tsc --noEmit`, `pnpm db:validate`, `pnpm auth:schema-check`, and `pnpm build` passed. S9 remains in progress pending staging review.

**Updated 21 October 2026:** added revocable, expiring external deliverable links with `deliveryToken`, expiry, revocation, and creation timestamps; Studio create/revoke actions; a copy-link control; and a private `/delivery/[token]` page that exposes only the deliverable title, project name, status, dates, description, and approved review URL. The public route returns 404 for revoked or unknown tokens. A disposable-server smoke test returned 200 for a valid token and 404 for revoked/unknown tokens. Discounts and the completion review remain.

### S10 — Media library, event galleries, and sharing

**Deliver:** private-by-default media upload, metadata, thumbnails, collections, event galleries, approved public publish flow, expiring/revocable share grants, and storage/CDN integration.

**Acceptance:** authorization is checked before upload and download; file type/size rules are enforced; unshared files have no public URL; gallery links can be revoked; public images/videos use optimized derivatives.

**Updated 27 October 2026:** Studio uploads now go directly from the browser to a private Vercel Blob store through a permission-checked upload-token route, avoiding Vercel Function request-size limits. The server verifies Blob metadata before associating the upload with the staff member's organization and project. Authorized reads are redirected to a five-minute signed URL scoped to a single object and `get` operation. Galleries and revocable share grants remain behind the app authorization route; public assets are still served through the same route. Private image derivatives are generated when `ffmpeg`/`ffprobe` are available. The production store and `BLOB_READ_WRITE_TOKEN` must be provisioned in Vercel before media uploads can run there.

**Updated 21 October 2026:** the local upload path now generates 960px and 480px WebP derivatives and image dimensions through `ffmpeg`/`ffprobe` when available, stores the derivative keys on `MediaAsset`, serves `?size=thumb|medium` through the authorized media route, and deletes all derivative files with the original. Studio previews and shared galleries use the smaller derivatives. If the host lacks `ffmpeg`, uploads still succeed and fall back to the original. Production storage/CDN and upload limits remain the acceptance blocker.

### S11 — Team, journal, and social publishing

**Deliver:** public team directory/profile pages, journal index/details, curated social links/posts, and CMS workflows using S6's shared content model.

**Acceptance:** staff can publish/unpublish each content type; social links lead to the original platform; team profiles only disclose approved information.

**Updated 21 October 2026:** added public `/team` and `/team/[slug]`, `/journal` and `/journal/[slug]`, and `/socials` routes backed by the published CMS content model. Team profiles only render published, organization-scoped records and approved fields; journal posts support cover media, excerpt, and body content; social links point to the original platforms. Staff can create, edit, publish, and unpublish each content type through S6. Header/footer navigation and homepage team/social/package previews now consume this content. Build and TypeScript checks passed, and a disposable run published one record of each type; the public index and detail routes returned 200 and rendered the published content.

### S12 — Release hardening and operations

**Deliver:** complete route/permission review, accessibility and responsive review, performance/SEO pass, security review, production environment, logging/monitoring, backup/restore procedure, and launch checklist.

**Acceptance:** type and lint checks are enforced in production build; critical user journeys work in staging; reduced motion is honored; data recovery is documented and demonstrated; deployment can be rolled back.

**Updated 27 October 2026:** inquiry email delivery now uses Gmail SMTP with persistent sent/failed status, error details for staff, and a permission-checked retry action in `/studio/inquiries`. Inquiry persistence succeeds even if SMTP delivery fails. The migration `20261027000100_inquiry_email_notifications` adds delivery tracking. TypeScript and the production build pass. Remaining S12 work: apply and verify the migration on the selected deployment database, configure the Vercel Blob store and Gmail SMTP values, stage-review the inquiry and media flows, complete accessibility/performance/SEO review, configure logging and backups, document restore/rollback, and recheck the Next.js security advisory. Public inquiry submissions stay disabled until launch settings and privacy details are approved.

**Updated 21 October 2026 (SEO/verification):** added `robots.txt` and a database-aware `sitemap.xml` that excludes Studio, delivery, share, quote, and draft-only routes; `SITE_URL` is the canonical-origin setting. A second fresh disposable PostgreSQL 18.6 cluster applied the then-current seven migrations, including `20261021000200_milestones_departments_delivery`; the new milestone, department, delivery, and media-derivative columns/tables were present. With that database configured, the production server returned 200 for `/packages`, `/brochure`, `/delivery/<valid-token>`, and `/api/health`; `/pricing` returned 308; revoked and unknown delivery tokens returned 404. `pnpm db:validate`, `pnpm auth:schema-check`, `npx tsc --noEmit`, and `pnpm build` passed. A final fresh cluster applied all eight migrations, including `20261021000300_quote_discounts`; the `discountAmount` and `discountLabel` columns were present. This did not re-run the full Studio role matrix, discount action flow, or production storage/CDN behavior.

## Follow-up cadence

- Work one slice at a time and keep the active slice small enough to review as a coherent user-facing or operational increment.
- At the start of a work session, read this tracker and resume the first incomplete slice whose dependencies are satisfied.
- At the end of each slice, update its status, record changed files, checks actually run, unresolved decisions, and the next slice. Never claim a check passed unless it was run.
- If a slice is waiting on an owner decision, continue independent work and record the specific decision needed here.
- User-facing checkpoints should report the completed increment and the next concrete slice. Do not silently jump to a later phase.

## Active next actions

1. Stage-review S7–S10: milestones/overview, multi-department crew, external delivery, quote discounts, and media derivatives.
2. Select the production/staging PostgreSQL target and apply the seven committed migrations there. The full migration history and new public routes are verified on disposable PostgreSQL 18.6 clusters; no shared or production database exists yet.
3. Continue S4 after owner decisions: confirm service scope and package rates, privacy/retention wording, and the inquiry notification destination. Gmail SMTP delivery is implemented; set its environment values before opening submissions. Until then `PUBLIC_INQUIRIES_ENABLED=false` keeps public collection paused.
4. Complete S12 hardening: staging verification, accessibility/performance/SEO pass, logging/backups/restore/rollback, lint gate, and a recheck of the Next.js security advisory before deployment.
5. Create and connect a private Vercel Blob store; Vercel will provision `BLOB_READ_WRITE_TOKEN`.

## Decisions currently waiting on the project owner

- Approve which of the supplied `public/DSC*.jpg` crew/event photographs may be published, plus credit/watermark treatment.
- Approve D-Team films, portraits, logo, and client marks for publication.
- Confirm whether YAW remains an independent live product; this plan keeps it separate.
- Confirm published package names/rates versus custom-quote-only services, and the budget-planner assumptions.
- Confirm brochure copy and distribution format within the no-new-dependency constraint.
- Confirm service descriptions, privacy contact and inquiry retention wording, plus the inbox recipient email.
- Confirm the proposed staff access permissions and the host/database target before applying migrations to a real deployment; create/connect the Vercel Blob store before S10 production use.

## Delivery update · 27 October 2026

- Deleted seven unreferenced raw camera files (`IMG_5250.MOV`, `IMG_5251.MOV`, `IMG_5265.MOV`, `IMG_5266.MOV`, `IMG_5268.MOV`, `IMG_5272.MOV`, `IMG_5273.MOV`). Preserved all optimized `reel-1` through `reel-3` MP4/WebM files and posters used by the showreel.
- Implemented inquiry notification delivery, persisted status/error/sent time, retry action, and migration `20261027000100_inquiry_email_notifications`.
- Implemented private Vercel Blob uploads, permission-scoped upload token creation, metadata validation, five-minute signed reads, and blob deletion alongside media deletion.
- Added SMTP and Blob settings to `.env.example`; no secrets were added.
- Checks run: `pnpm exec tsc --noEmit`, `pnpm db:validate`, and `pnpm build` pass. Database migration, Gmail delivery, and Blob transfer still need environment-backed staging verification.
