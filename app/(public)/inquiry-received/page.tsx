import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inquiry received | D-Team Studio",
  robots: { index: false, follow: false },
};

export default function InquiryReceivedPage() {
  return (
    <main className="inquiry-confirmation section-wrap" id="main-content">
      <p className="eyebrow">D—TEAM STUDIO · PROJECT INQUIRY</p>
      <h1>We have your<br /><em>starting point.</em></h1>
      <p>Your project inquiry has been received. The team can review the brief and follow up about next steps.</p>
      <Link className="text-link" href="/">Back to D-Team Studio <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
