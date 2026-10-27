"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/studio/content", label: "Portfolio" },
  { href: "/studio/content/services", label: "Services & packages" },
  { href: "/studio/content/team", label: "Team" },
  { href: "/studio/content/journal", label: "Journal" },
  { href: "/studio/content/social", label: "Social" },
  { href: "/studio/content/homepage", label: "Homepage" },
  { href: "/studio/content/history", label: "History" },
];

export function ContentSubnav() {
  const pathname = usePathname();
  return (
    <nav className="studio-subnav" aria-label="Website content sections">
      {sections.map((section) => {
        const active = section.href === "/studio/content" ? pathname === section.href : pathname.startsWith(section.href);
        return (
          <Link key={section.href} href={section.href} aria-current={active ? "page" : undefined}>
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
