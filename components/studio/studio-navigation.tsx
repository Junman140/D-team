"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavigationProps = {
  canReadInquiries: boolean;
  newInquiryCount: number;
  canReadContent: boolean;
  canReadClients: boolean;
  canReadProjects: boolean;
  canReadCrew: boolean;
  canReadSchedule: boolean;
  canReadQuotes: boolean;
  canReadDeliverables: boolean;
  canReadMedia: boolean;
};

export function StudioNavigation(props: NavigationProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = (href: string) => pathname === href || (href !== "/studio" && pathname.startsWith(href));
  const currentLabel = pathname.startsWith("/studio/content") ? "Website content" : pathname.startsWith("/studio/inquiries") ? "Inquiries" : pathname.startsWith("/studio/projects") ? "Projects" : pathname.startsWith("/studio/clients") ? "Clients" : pathname.startsWith("/studio/crew") ? "Crew" : pathname.startsWith("/studio/calendar") ? "Calendar" : pathname.startsWith("/studio/quotes") ? "Quotes" : pathname.startsWith("/studio/deliverables") ? "Deliverables" : pathname.startsWith("/studio/media") ? "Media" : "Overview";

  return (
    <nav className="studio-navigation" aria-label="Production workspace" data-expanded={open}>
      <button className="studio-nav-mobile-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span><small>WORKSPACE MENU</small><strong>{currentLabel}</strong></span><span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <p className="eyebrow">WORKSPACE</p>
      <Link href="/studio" aria-current={pathname === "/studio" ? "page" : undefined} onClick={() => setOpen(false)}>Overview</Link>
      {props.canReadInquiries && (
        <Link href="/studio/inquiries" aria-current={current("/studio/inquiries") ? "page" : undefined} onClick={() => setOpen(false)}>
          Inquiries <span className="studio-inquiry-count" aria-label={`${props.newInquiryCount} new`}>{props.newInquiryCount}</span>
        </Link>
      )}
      {props.canReadProjects && <Link href="/studio/projects" aria-current={current("/studio/projects") ? "page" : undefined} onClick={() => setOpen(false)}>Projects</Link>}
      {props.canReadClients && <Link href="/studio/clients" aria-current={current("/studio/clients") ? "page" : undefined} onClick={() => setOpen(false)}>Clients</Link>}
      {props.canReadCrew && <Link href="/studio/crew" aria-current={current("/studio/crew") ? "page" : undefined} onClick={() => setOpen(false)}>Crew</Link>}
      {props.canReadSchedule && <Link href="/studio/calendar" aria-current={current("/studio/calendar") ? "page" : undefined} onClick={() => setOpen(false)}>Calendar</Link>}
      {props.canReadQuotes && <Link href="/studio/quotes" aria-current={current("/studio/quotes") ? "page" : undefined} onClick={() => setOpen(false)}>Quotes</Link>}
      {props.canReadDeliverables && <Link href="/studio/deliverables" aria-current={current("/studio/deliverables") ? "page" : undefined} onClick={() => setOpen(false)}>Deliverables</Link>}
      {props.canReadMedia && <Link href="/studio/media" aria-current={current("/studio/media") ? "page" : undefined} onClick={() => setOpen(false)}>Media</Link>}
      {props.canReadContent && <Link href="/studio/content" aria-current={current("/studio/content") ? "page" : undefined} onClick={() => setOpen(false)}>Website content</Link>}
      <p className="studio-sidebar-note">Access follows workspace roles. Private project records never appear on the public site.</p>
    </nav>
  );
}
