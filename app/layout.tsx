import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "D—Team | Dynamic Creative Agency — Ideas into impact",
  description:
    "D Team is a dynamic creative agency transforming ideas into impactful creative experiences — media production, visual storytelling, branding, digital marketing, and strategic insight.",
};

const themeInit = `(function(){try{var stored=localStorage.getItem("dte-theme");var theme=stored==="light"?"light":"dark";document.documentElement.dataset.theme=theme}catch(e){document.documentElement.dataset.theme="dark"}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
