"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const messages: Record<string, (value: string) => string> = {
  created: () => "Created successfully.",
  updated: () => "Changes saved.",
  published: () => "Published successfully.",
  unpublished: () => "Moved back to draft.",
  deleted: () => "Deleted successfully.",
  saved: () => "Changes saved.",
  status: (value) => `Status updated to ${value.replaceAll("-", " ")}.`,
  converted: () => "Inquiry converted to a project.",
  memberAdded: () => "Crew member assigned to the project.",
  memberRemoved: () => "Crew member removed from the project.",
  milestone: (value) => `Milestone ${value} successfully.`,
  availability: () => "Crew availability saved.",
  availabilityRemoved: () => "Crew availability removed.",
  packageCreated: () => "Package draft created.",
  packageUpdated: () => "Package changes saved as a draft.",
  packagePublished: () => "Package published.",
  packageUnpublished: () => "Package moved back to draft.",
  packageDeleted: () => "Package deleted.",
  uploaded: () => "Media uploaded.",
  visibility: (value) => `Media visibility set to ${value}.`,
  galleryCreated: () => "Gallery created.",
  gallery: () => "Gallery changes saved.",
  galleryPublished: () => "Gallery published.",
  galleryUnpublished: () => "Gallery unpublished.",
  shareToken: () => "Share link created.",
  revoked: () => "Share link revoked.",
  link: (value) => `Delivery link ${value}.`,
  lineAdded: () => "Quote line added.",
  lineRemoved: () => "Quote line removed.",
  discount: () => "Quote discount saved.",
};

export function StudioActionFeedback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const match = Object.entries(messages).find(([key]) => searchParams.has(key));
  if (!match) return null;
  const [key, getMessage] = match;

  function dismiss() {
    const params = new URLSearchParams(searchParams.toString());
    for (const actionKey of Object.keys(messages)) params.delete(actionKey);
    const suffix = params.size ? `?${params.toString()}` : "";
    router.replace(`${pathname}${suffix}`, { scroll: false });
  }

  return (
    <div className="studio-action-feedback" role="status" aria-live="polite">
      <span aria-hidden="true">✓</span>
      <p>{getMessage(searchParams.get(key) ?? "")}</p>
      <button type="button" onClick={dismiss} aria-label="Dismiss confirmation">×</button>
    </div>
  );
}
