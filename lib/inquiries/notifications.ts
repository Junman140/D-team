import "server-only";

import nodemailer from "nodemailer";

type InquiryEmail = {
  id: string;
  name: string;
  email: string;
  serviceSlug: string;
  eventDate: Date | null;
  location: string | null;
  details: string;
};

export function inquiryEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.INQUIRY_NOTIFY_EMAIL);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export async function sendInquiryNotification(inquiry: InquiryEmail) {
  if (!inquiryEmailConfigured()) throw new Error("SMTP notification settings are incomplete.");
  const user = process.env.SMTP_USER!;
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass: process.env.SMTP_PASS! },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  const date = inquiry.eventDate ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(inquiry.eventDate) : "Not supplied";
  const from = process.env.SMTP_FROM || user;
  try {
    await transport.sendMail({
      from,
      to: process.env.INQUIRY_NOTIFY_EMAIL,
      replyTo: inquiry.email,
      subject: `New D-Team inquiry: ${inquiry.name} · ${inquiry.serviceSlug}`,
      text: [
        `New project inquiry (${inquiry.id})`, `Name: ${inquiry.name}`, `Email: ${inquiry.email}`,
        `Service: ${inquiry.serviceSlug}`, `Event date: ${date}`, `Location: ${inquiry.location || "Not supplied"}`,
        "", "Project brief:", inquiry.details,
      ].join("\n"),
      html: `<h2>New D-Team project inquiry</h2><dl><dt>Name</dt><dd>${escapeHtml(inquiry.name)}</dd><dt>Email</dt><dd>${escapeHtml(inquiry.email)}</dd><dt>Service</dt><dd>${escapeHtml(inquiry.serviceSlug)}</dd><dt>Event date</dt><dd>${escapeHtml(date)}</dd><dt>Location</dt><dd>${escapeHtml(inquiry.location || "Not supplied")}</dd></dl><h3>Project brief</h3><p>${escapeHtml(inquiry.details).replace(/\n/g, "<br>")}</p><p>Inquiry ID: ${escapeHtml(inquiry.id)}</p>`,
    });
  } finally {
    transport.close();
  }
}

export function notificationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Email delivery failed.";
  return message.slice(0, 500);
}
