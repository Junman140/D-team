"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LiveClock } from "@/components/public/motion";
import { MotionControl } from "@/components/public/motion-control";
import { ThemeToggle } from "@/components/public/theme-toggle";

const navigation = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/packages", label: "Packages" },
  { href: "/journal", label: "Journal" },
  { href: "/team", label: "Team" },
  { href: "/socials", label: "Socials" },
];

function NavigationLinks({
  activeHref,
  onNavigate,
}: {
  activeHref: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navigation.map(({ href, label }) => (
        <a
          className={`navigation-link${activeHref === href ? " is-active" : ""}`}
          href={href}
          key={href}
          aria-current={activeHref === href ? "location" : undefined}
          onClick={onNavigate}
        >
          {label}
        </a>
      ))}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setIsScrolled(window.scrollY > 12);
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const syncActiveLink = () => setActiveHref(window.location.hash);
    if (pathname.startsWith("/work")) {
      setActiveHref("/work");
      return;
    }
    if (pathname.startsWith("/packages")) {
      setActiveHref("/packages");
      return;
    }
    if (["/services", "/pricing", "/request-quote"].some((path) => pathname.startsWith(path))) {
      setActiveHref("/services");
      return;
    }
    if (pathname.startsWith("/journal")) {
      setActiveHref("/journal");
      return;
    }
    if (pathname.startsWith("/team")) {
      setActiveHref("/team");
      return;
    }
    if (pathname.startsWith("/socials")) {
      setActiveHref("/socials");
      return;
    }
    syncActiveLink();
    window.addEventListener("hashchange", syncActiveLink);
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const currentSection = entries.find((entry) => entry.isIntersecting);
        if (currentSection) setActiveHref(`#${currentSection.target.id}`);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    document.querySelectorAll("#work, #capabilities, #team").forEach((section) => {
      sectionObserver.observe(section);
    });
    return () => {
      window.removeEventListener("hashchange", syncActiveLink);
      sectionObserver.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}${isMenuOpen ? " menu-open" : ""}`}>
      <a className="wordmark" href="/#top" aria-label="D-Team Studio home">
        D<span>—</span>TEAM<span className="wordmark-period">.</span>
      </a>

      <nav className="desktop-nav" aria-label="Main navigation">
        <NavigationLinks activeHref={activeHref} />
      </nav>

      <div className="header-actions">
        <span className="header-clock" aria-hidden="true"><span>LAGOS</span><LiveClock /></span>
        <MotionControl />
        <ThemeToggle />
        <a className="header-cta" href="/request-quote">
          Start a project <span aria-hidden="true">↗</span>
        </a>
      </div>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={isMenuOpen}
        aria-controls="mobile-navigation"
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsMenuOpen((open) => !open)}
        ref={menuButtonRef}
      >
        <span className={`menu-icon${isMenuOpen ? " is-open" : ""}`} aria-hidden="true">
          <span />
          <span />
        </span>
        <span className="menu-toggle-label">{isMenuOpen ? "Close" : "Menu"}</span>
      </button>

      <nav
        className="mobile-nav"
        id="mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!isMenuOpen}
      >
        <NavigationLinks activeHref={activeHref} onNavigate={closeMenu} />
        <a className="mobile-nav-cta" href="/request-quote" onClick={closeMenu}>
          Start a project <span aria-hidden="true">↗</span>
        </a>
      </nav>
      <span className="scroll-progress" ref={progressRef} aria-hidden="true" />
    </header>
  );
}
