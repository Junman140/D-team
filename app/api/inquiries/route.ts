import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { getServiceOffering, serviceOfferings } from "@/features/services/services";
import { consumeInquiryRateLimit, InquiryRateLimitExceededError } from "@/lib/inquiries/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

class RequestBodyError extends Error {
  constructor(public readonly status: 400 | 413) {
    super("Invalid inquiry request body.");
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) throw new RequestBodyError(413);

  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError(400);

  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RequestBodyError(413);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new RequestBodyError(400);
  }
}

function validateInquiry(value: unknown, allowedServiceSlugs: Set<string>) {
  const errors: Record<string, string> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { data: null, errors: { form: "Enter your project details and try again." } };
  }

  const body = value as Record<string, unknown>;
  const submissionKey = typeof body.submissionKey === "string" ? body.submissionKey : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const serviceSlug = typeof body.serviceSlug === "string" ? body.serviceSlug : "";
  const eventDate = typeof body.eventDate === "string" ? body.eventDate : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";

  if (!UUID_PATTERN.test(submissionKey)) errors.submissionKey = "Refresh the form and try again.";
  if (name.length < 2 || name.length > 100) errors.name = "Enter a name between 2 and 100 characters.";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";
  if (!allowedServiceSlugs.has(serviceSlug)) errors.serviceSlug = "Choose one of the listed services.";
  if (eventDate) {
    const parsedEventDate = new Date(`${eventDate}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(parsedEventDate.getTime()) || parsedEventDate.toISOString().slice(0, 10) !== eventDate) {
      errors.eventDate = "Enter a valid date or leave this field blank.";
    }
  }
  if (location.length > 160) errors.location = "Keep the location under 160 characters.";
  if (details.length < 30 || details.length > 3000) errors.details = "Describe the project in 30 to 3,000 characters.";
  if (body.consent !== true) errors.consent = "Confirm that D-Team may use these details to respond to this inquiry.";

  if (Object.keys(errors).length > 0) return { data: null, errors };
  return {
    data: {
      submissionKey,
      name,
      email,
      serviceSlug,
      eventDate: eventDate ? new Date(`${eventDate}T00:00:00.000Z`) : null,
      location: location || null,
      details,
    },
    errors: {},
  };
}

export async function POST(request: Request) {
  if (process.env.PUBLIC_INQUIRIES_ENABLED !== "true") {
    return Response.json({ message: "Inquiry submissions are not available yet." }, { status: 503 });
  }

  const expectedUrl = process.env.BETTER_AUTH_URL;
  const origin = request.headers.get("origin");
  if (!expectedUrl || !origin) return Response.json({ message: "Inquiry form is not configured." }, { status: 503 });
  try {
    if (new URL(expectedUrl).origin !== origin) return Response.json({ message: "Request origin is not allowed." }, { status: 403 });
  } catch {
    return Response.json({ message: "Inquiry form is not configured." }, { status: 503 });
  }

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!process.env.DATABASE_URL || !secret || secret.length < 32) {
    return Response.json({ message: "Inquiry form is not configured." }, { status: 503 });
  }
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return Response.json({ message: "Send the inquiry as JSON." }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return Response.json({ message: "The inquiry could not be read. Check the form and try again." }, { status });
  }

  if (body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).website === "string" && (body as Record<string, unknown>).website) {
    return Response.json({ success: true }, { status: 201 });
  }

  const prisma = getPrisma();
  const organization = await prisma.organization.findUnique({ where: { slug: "d-team-production" }, select: { id: true } });
  if (!organization) return Response.json({ message: "Inquiry form is not available yet." }, { status: 503 });
  const publishedServices = await prisma.service.findMany({ where: { organizationId: organization.id, status: "published" }, select: { slug: true, name: true } });
  const allowedServiceSlugs = new Set([...serviceOfferings.map((service) => service.slug), ...publishedServices.map((service) => service.slug)]);

  const validation = validateInquiry(body, allowedServiceSlugs);
  if (!validation.data) {
    return Response.json({ message: "Check the highlighted fields and try again.", errors: validation.errors }, { status: 422 });
  }

  const existing = await prisma.inquiry.findUnique({ where: { submissionKey: validation.data.submissionKey }, select: { organizationId: true } });
  if (existing?.organizationId === organization.id) return Response.json({ success: true }, { status: 200 });
  if (existing) return Response.json({ message: "Refresh the form and try again." }, { status: 409 });

  const ipAddress = request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || undefined;
  try {
    await consumeInquiryRateLimit({ secret, email: validation.data.email, ipAddress });
  } catch (error) {
    if (error instanceof InquiryRateLimitExceededError) {
      return Response.json({ message: "Too many requests. Please wait before sending another inquiry." }, { status: 429 });
    }
    return Response.json({ message: "The inquiry could not be saved. Please try again later." }, { status: 500 });
  }

  const service = getServiceOffering(validation.data.serviceSlug) ?? publishedServices.find((entry) => entry.slug === validation.data!.serviceSlug);
  if (!service) return Response.json({ message: "Choose one of the listed services." }, { status: 422 });

  try {
    await prisma.$transaction(async (transaction) => {
      const inquiry = await transaction.inquiry.create({
        data: {
          ...validation.data!,
          organizationId: organization.id,
          consentedAt: new Date(),
          consentVersion: "project-inquiry-v1",
        },
        select: { id: true },
      });
      await transaction.auditEvent.create({
        data: {
          organizationId: organization.id,
          action: "created",
          resource: "inquiry",
          resourceId: inquiry.id,
          metadata: { source: "public-form", serviceSlug: service.slug },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicate = await prisma.inquiry.findUnique({ where: { submissionKey: validation.data.submissionKey }, select: { organizationId: true } });
      if (duplicate?.organizationId === organization.id) return Response.json({ success: true }, { status: 200 });
    }
    return Response.json({ message: "The inquiry could not be saved. Please try again later." }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201 });
}
