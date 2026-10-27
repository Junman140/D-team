# D-Team UI/UX Motion & Redesign Plan · 24 October 2026

**Motion steering update · 24 October:** the owner wants motion to remain present across the experience. The homepage photo story now advances continuously with an always-visible pause control; hero and story photography use slow ambient movement. All ambient motion stops for `prefers-reduced-motion`, and video remains user-initiated.

Reference site: https://www.dg-cinema.com/ (studied via its published HTML/CSS). Its pattern language is mapped onto D-Team's own colors, images, and typography below — we replicate the **interactions and layouts**, not their assets or code.

## 1. What dg-cinema.com actually does (extracted patterns)

1. **Dark cinema theme**: near-black bg `#09080A`, warm off-white text `#F8F3F3`, muted secondary `#BBBABB`, one loud accent (`#E50913` red). Headings use gradient-clipped text (silver fade).
2. **Preloader**: percentage counter + pulsing accent dot + 4 vertical stripes that wipe away in sequence before the page shows.
3. **Smooth scrolling** (Lenis-style) with scroll-lock when a modal opens.
4. **Linear photo marquee** under the hero title: an auto-scrolling film strip of stills (infinite loop, linear timing) framed by side rules and shadow vignettes.
5. **Corner-bracket SVG decorations** framing the hero and key images; tiny SVG ornaments (counter text `3 . . 2 . . 1 . . 0 . . 2 . . 3`, pulsing dot beside the CTA).
6. **Live local clock** in a slim header-bottom bar.
7. **Scroll reveals** on every section heading/paragraph (fade-up from `opacity:0`).
8. **Layered image stacks**: a hero image sitting on offset duplicate frames; a featured film shot ringed by symmetric duplicates with soft shadows.
9. **Typographic statement section**: giant words interleaved with inline photo chips ("we [photo] open new boundaries of cinema combining [photo] skill…").
10. **Header that gains a translucent dark background + active style** once scrolling.
11. **Services as an icon-tile list**, story detail as a **popup overlay** (logline + synopsis), footer with icon+label social links.
12. Motion hygiene: `will-change` only on animated strips, everything transform/opacity.

## 2. Why our current UI feels dead (diagnosis)

- **Theme toggle "not working"**: the button does set `data-theme` (component logic is correct) but only **12 CSS rules** react to it — almost every homepage section hardcodes colors (`#242822`, `#e9e8df`, etc.). Toggling therefore changes nearly nothing. Fix = move every color to theme-aware tokens, not more hardcoding.
- **No motion system**: only a one-time scroll reveal exists. No marquees, no counter, no pulsing markers, no layered hover states, no preloader.
- **Slow/boring slideshow**: the photo story is a bare 5.2s crossfade; the showreel strip has no continuous motion.
- **Pillars are a flat vertical list** in a dark block — the least DG-like element on the page.

## 3. Design tokens & theming (Phase 0) — fixes the dead toggle first

- Refactor `:root` into two full palettes: **Cinema Dusk (dark, default)** — bg `#0B0D0A`, panel `#121510`, ink `#F3F2E9`, muted `#A5A79A`, accent `var(--acid)#D8F36A`, deep accent shadows; and **Studio Paper (light)** — current paper/ink look, preserved.
- Every section reads `var(--bg)`, `var(--panel)`, `var(--ink)`, `var(--muted)`, `var(--accent)`; delete hardcoded hexes. Dark is default (film-studio feel), toggle flips tokens + persists. Homepage hero photo dims/scales slightly on theme switch for a tactile response.
- Gradient-clipped headings (`linear-gradient(ink→muted)`) on H1/H2 exactly like DG, using our display font.
- Owner gate: none (colors are ours already).

## 4. Shared motion vocabulary (Phase 1)

New `components/public/motion.tsx` + small CSS layer; all animations transform/opacity only, and every one collapses under `prefers-reduced-motion: reduce`.

1. **Preloader** — **skipped** by owner decision; the hero reveals directly. The pulsing acid dot lives in the eyebrow, CTAs, and index instead.
2. **Reveal-on-scroll 2.0**: staggered fade-up (80–120ms steps per item) for headings, cards, list rows; replaces the current single observer with per-element thresholds.
3. **Marquee primitive** (the workhorse, DG's core move): CSS `@keyframes marquee` translating a duplicated track at **linear** timing; generic component `MarqueeRow` (speed/direction props) reused everywhere below.
4. **Pulse dot + tick row**: acid dot next to CTAs and section eyebrows; small mono tick row (`1 . . 2 . . 3`) separators, our mono font.
5. **Header 2.0**: underline grow-on-hover links, hamburger now slides a full overlay menu (like DG's), header gains `backdrop-filter` blur + acrylic tint on scroll (replaces plain sticky paper).
6. **Hover language**: cards/photos zoom-scale 1.05 with inner parallax shift, arrows nudge, buttons fill invert.
7. **Live clock** in a slim bar under the header (`WA  ·  11:41:32` — contact as the anchor, ties motion to conversions).

## 5. Homepage section re-spec (Phase 2) — DG layouts, our assets

- **Hero**: big gradient title "Ideas into impact.", corner brackets in 4 corners, CTA with pulsing dot, scroll index `01 — 04`. Under it, the **existing hero photo** framed by bracket + shadow vignette like DG's featured frame.
- **Intro mosaic stays** (owner lock): the five-frame mosaic is kept static; the hero image and on-set story carry slow ambient movement alongside the services strip.
- **Events → two stacked offset columns** (owner lock): three cards per column, right column dropped 110px, corner brackets and photo zoom on hover; all six stay visible without motion.
- **Showreel strip**: keep the tap-to-play cards exactly as they are; no auto-drift (owner lock).
- **Pillars— NOT a straight line**: rebuilt as DG's layered editorial block — five cards rotate-staggered (`translateY` + slight `rotate(-2°…2°)`) in an overlapping cluster, numbered oversized outlines, acid accent on the active/hovered card, mobile: 2-column stagger with offsets. No flat list.
- **Typographic statement**: between events and team — giant text line with inline photo chips from our library ("We combine [photo] skill and [photo] originality to turn ideas into impact."), mirroring DG's "limits" section.
- **Services → the primary moving strip**: 16 services in a two-row marquee (opposite directions) with a single **Pause/Play motion** control; each pill = number + title + acid dot and deep-links to its service page. Hover/focus pauses; reduced-motion shows a static wrap. The full list stays on `/services`.
- **Team + contact**: crew photos get the corner-bracket treatment; closing contact block keeps WhatsApp/Call with pulse dots and adds the live Lagos clock bar under the contact links.
- **Privacy**: all running strips pause on hover/focus and respect `prefers-reduced-motion`; nothing autoplays audio/video.

## 6. Content corrections (Phase 2, same sweep)

1. **Rename `Camp Champion` → `VC Townhall Meeting`** everywhere (`features/portfolio/projects.ts`, cover alt, dev slugs). Keep the school-hall cover until told otherwise.
2. **Services expansion (13 → 16)**: add **Social media build & management** (we build and manage social media — merge/raise beyond the existing social item), **Network engineering**, **Software & systems engineering**. Covers/trays/source sheets stay reusable.
3. **Teams page from the supplied name files**: the library already names members in filenames — `cbrownson, danikono, daniel, dann*, deborah, dembo, ekemini*, esther(+esther1), godwin, harry, humble, isreal, ini, inimfon, joel, josh, joshua, junman(+junmalead/junman2), kemi, kindness(+kindness2), lyta, mercy(+mercy1), metiro(+metrio2), pmercy, psaviour, saviour, watson(+watson2), wisdom, zaddy, supplyer` — * flagged ambiguous/duplicates needing the owner's tie-break. `/team` becomes a real roster: portrait frame + name + role placeholder, grouped under direction / production / engineering / media; the "30 members" copy stays. No invented roles.

## 7. Pages touched & order

Phase 0 → Phase 1 → Phase 2 above; then:
2. **`/work` + case studies**: cover hover parallax, staggered grid, story pages open like DG popup (logline/synopsis first screen).
3. **`/services`, `/packages`, `/brochure`**: reveal + hover passes only (cheap), no structural rewrite.
4. **`/team`**: roster build (Phase 2 item 3).
5. **Late**: `/socials`, `/journal`, `404` message, Studio non-goal (dashboard stiffness is fine there).

## 8. Acceptance gates

- Theme toggle visibly re-skins homepage + all public pages; persists across reload.
- No `position:fixed`/scroll-jank regressions; Lighthouse-style check: no CLS from marquees (fixed heights), lazy beyond-fold images, `will-change` only on running strips.
- Every CSS motion collapses under `prefers-reduced-motion` (preloader → static, marquees → static rows, reveals → immediate).
- Six events + 16 services + 30-member roster content state shipped; owner confirms ambiguous team names and full names/role titles before `/team` publication.
- `npx tsc --noEmit` + `pnpm build` + no-DB and dev smoke at each phase close.

## 9. Status (23 October 2026)

- **Phase 0 complete** — dark-first tokens, light override, gradient hero, scoped light palettes for studio/auth/brochure. Theme toggle verified in a hydrated browser (dark → light → persists across routes).
- **Phase 1 complete** — `components/public/motion.tsx` (marquee + services strip + live clock), `corners.tsx`, pulsing dots/tick rows, header blur-on-scroll, stagger reveals, hover language; every animation collapses under `prefers-reduced-motion` (verified: animation `none`, duplicate track hidden, strip scrollable).
- **Phase 2 shipped** — hero brackets/index, two offset event columns, scattered pillar cards, typographic statement with photo chips, services marquee with pause control, crew brackets, contact clock bar; content corrections: Camp Champion → VC Townhall Meeting, services 13 → 16. Team roster build remains owner-gated.
- Dev-origin fix: `allowedDevOrigins: ["127.0.0.1", "localhost"]` so HMR reaches both hosts.
- **Phase 3 shipped** — `/work` now has a staggered two-column grid with pointer-driven cover parallax, quick-look story overlays, and hover title lift; case studies add DG-style layered cover frames, corner brackets, a gradient H1, and a logline/synopsis dialog (Esc/backdrop close, scroll lock, focus return, Tab trap). `StoryOverlay` (`components/public/story-overlay.tsx`) is reusable on any project.
- **Reference patterns adopted beyond the first pass** — full-screen mobile menu (replaces the dropdown, covers the WhatsApp FAB), gradient-clipped section H1/H2s in dark theme, service-row and package-card hover states, and scroll reveals moved to the public layout so `/services`, `/packages`, and `/brochure` animate too.
- **Phase 4 shipped** — `/socials` got reveal rows, an official-status pulse, and a direct WhatsApp CTA; `/journal` uses a themed empty state and hover-lift cards; a branded `app/not-found.tsx` (corner brackets, gradient headline, home/work routes, header/footer/FAB, `noindex`) serves unknown URLs with a real 404 status.
- **Phase 5 shipped** — the header carries a Lagos live clock on wide screens, the footer was rebuilt as a responsive grid with TikTok/WhatsApp/call icon links, and the WhatsApp FAB now hands off (fades and leaves the tab order) when the footer enters view. Tablet headers hide the CTA/toggle label between 761–1080px so the wordmark never wraps.
- **Phase 6 shipped (motion system)** — installed Impeccable (`npx impeccable install`, OpenCode build) and used its `animate` + craft-floor guidance. One easing family and duration scale now drives: route-change page enter (`app/(public)/template.tsx`), an authored homepage hero sequence (eyebrow → title shutter → copy → frame wipe → stamp → index), shutter-mask H1/H2 reveals on every public page, a drawn hero index rule, a circular theme wipe from the toggle (View Transitions with graceful fallback), staggered full-screen menu links, a header scroll-progress hairline, shared press feedback, and themed scrollbars/caret. Reduced motion keeps content visible and removes travel. Gradient display type was replaced with solid ink + acid accents; the Impeccable detector now reports no findings.
- Next: `/team` roster (owner-gated), Studio non-goal, final cross-browser pass.

## Audit follow-up · 24 October 2026

- Removed an earlier mismatch where the on-set photo story auto-advanced without a pause control; it now moves every 6.2 seconds, exposes a clear pause/play control, announces the active image to assistive technology, and stays still for reduced-motion preferences.
- Added slow ambient drift to the hero and active story photography. These loops are disabled under reduced motion; showreel videos remain tap-to-play.
- Fixed the homepage release fallback so static draft case studies only appear for development or authorized preview. Production now shows the published CMS entries, or an empty state if none are published.
- Corrected the static draft slug and cover lookup for VC Townhall Meeting.
- Tightened story-dialog title IDs so repeated dialogs have unique accessible labels; Shift+Tab from the dialog container now wraps to the last control.
- `pnpm exec tsc --noEmit` and `pnpm build` pass. Live browser review confirmed auto-advance, pause, and a stable frame after pausing; a production-mode no-database homepage showed the correct published-work empty state. A no-database production route sweep returned 200 for the homepage, work, services, packages, brochure, team, journal, socials, quote request, privacy, and terms; a missing route returned 404. Remaining audit scope: verify reduced-motion live, inspect key public routes at narrow and wide viewports, and finish cross-browser/accessibility review. Team roster remains owner-gated; approved photography, credits, package terms, and production release decisions remain open.

## 24 October — motion direction and Studio UI review

- Direction: **live production desk** — near-black control rail, signal-lime active states, warm paper work surfaces, editorial typography, and motion reserved for state, focus, and cinematic emphasis. The Studio now has a responsive collapsible nav on narrow screens, a persistent dark rail on desktop, calmer card depth, clear active state, and improved touch/focus targets on summaries and form controls.
- Added a site-wide motion switch in the public header. It pauses CSS animation and the photo-story auto-advance; reduced-motion preferences still suppress automatic movement. Marquees, hero drift, and reveal behavior retain their existing reduced-motion handling.
- Studio content forms had no visual portrait library, forcing editors to type a path and making asset matching error-prone. The team editor now offers a named portrait selector and current-image thumbnail. The supplied filenames are also used in a **development-only sample roster** with conspicuously temporary role labels. Existing sample package scopes now show illustrative NGN rates in preview only. Production continues to use its existing draft package-scope fallback with custom-quote wording; no sample person, role, or sample rate is published or written to the CMS.
- Found an end-to-end feedback gap: Studio actions redirected with `created`, `updated`, and status query markers, but pages never displayed them. The shared Studio shell now turns those markers into dismissible, announced success messages and preserves unrelated filters.
- Deep review also confirmed the admin form set relies on repeated long pages and native disclosures, and the media share-grant table is horizontally scrollable on small screens. These are still candidates for later workflow work: searchable/filterable lists, explicit confirmation for destructive actions, and compact card rendering for data tables on phones. Review the sensitive delete/revoke actions before a production staff rollout.
- Remaining owner decisions: verify name-to-photo matches where multiple filename variants exist; approve actual roles and bios; approve package names, inclusions, rates, terms, credits, and public release.
