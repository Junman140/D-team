"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { serviceOfferings } from "@/features/services/services";

type FieldErrors = Record<string, string>;

export function InquiryForm({ services = [], initialDetails = "", initialService = "" }: { services?: { slug: string; name: string }[]; initialDetails?: string; initialService?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submissionKey = useRef<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setErrors({});
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    submissionKey.current ??= crypto.randomUUID();
    const requestBody = {
      ...payload,
      consent: formData.get("consent") === "on",
      submissionKey: submissionKey.current,
    };

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json() as { message?: string; errors?: FieldErrors; success?: boolean };

      if (response.ok && result.success) {
        router.push("/inquiry-received");
        return;
      }

      setErrors(result.errors ?? {});
      setMessage(result.message ?? "The inquiry could not be sent. Please try again.");
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    } catch {
      setMessage("We could not reach the inquiry service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function errorFor(name: string) {
    return errors[name] ? <span className="inquiry-field-error" id={`${name}-error`}>{errors[name]}</span> : null;
  }

  function fieldProps(name: string) {
    return {
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
    };
  }

  return (
    <form className="inquiry-form" onSubmit={submitInquiry} ref={formRef} noValidate>
      {message && <p className="inquiry-form-message" role="alert">{message}</p>}

      <div className="inquiry-field">
        <label htmlFor="name">Your name <span aria-hidden="true">*</span></label>
        <input id="name" name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required {...fieldProps("name")} />
        {errorFor("name")}
      </div>

      <div className="inquiry-field">
        <label htmlFor="email">Work email <span aria-hidden="true">*</span></label>
        <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required {...fieldProps("email")} />
        {errorFor("email")}
      </div>

      <div className="inquiry-field">
        <label htmlFor="serviceSlug">What do you need? <span aria-hidden="true">*</span></label>
        <select id="serviceSlug" name="serviceSlug" defaultValue={initialService} required {...fieldProps("serviceSlug")}>
          <option value="" disabled>Select a capability</option>
          {(services.length ? services : serviceOfferings.map(({ slug, name }) => ({ slug, name }))).map((service) => <option value={service.slug} key={service.slug}>{service.name}</option>)}
        </select>
        {errorFor("serviceSlug")}
      </div>

      <div className="inquiry-field">
        <label htmlFor="eventDate">Event or project date</label>
        <input id="eventDate" name="eventDate" type="date" {...fieldProps("eventDate")} />
        {errorFor("eventDate")}
      </div>

      <div className="inquiry-field inquiry-field-wide">
        <label htmlFor="location">Location <span className="field-optional">OPTIONAL</span></label>
        <input id="location" name="location" type="text" autoComplete="address-level2" maxLength={160} {...fieldProps("location")} />
        {errorFor("location")}
      </div>

      <div className="inquiry-field inquiry-field-wide">
        <label htmlFor="details">Tell us about the project <span aria-hidden="true">*</span></label>
        <textarea id="details" name="details" rows={6} minLength={30} maxLength={3000} required defaultValue={initialDetails} aria-describedby={errors.details ? "details-error" : "details-help"} aria-invalid={errors.details ? true : undefined} />
        <span className="inquiry-help" id="details-help">Include the goal, audience, and what you need from the production team. Do not include confidential or sensitive information.</span>
        {errorFor("details")}
      </div>

      <div className="inquiry-consent inquiry-field-wide">
        <input id="consent" name="consent" type="checkbox" required aria-describedby={errors.consent ? "consent-error" : undefined} aria-invalid={errors.consent ? true : undefined} />
        <label htmlFor="consent">I agree that D-Team may use these details to review and respond to this project inquiry.</label>
        {errorFor("consent")}
      </div>

      <div className="inquiry-honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field blank</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="inquiry-form-footer inquiry-field-wide">
        <p>Only the information needed to respond is requested. Authorized D-Team staff can view submitted inquiries. Privacy contact and retention details are still pending owner approval.</p>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? "SENDING…" : "SEND PROJECT INQUIRY ↗"}</button>
      </div>
    </form>
  );
}
