"use client";

import { useEffect, useId, useRef, useState } from "react";

export type StoryContent = {
  title: string;
  logline: string;
  synopsis: string;
  categories: string[];
  year?: number | null;
  status?: "draft" | "published";
};

export function StoryOverlay({
  story,
  label = "Read the logline & synopsis",
  className = "",
}: {
  story: StoryContent;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const initialFocus = dialog?.querySelector<HTMLElement>("button:not([disabled]), a[href]");
    (initialFocus ?? dialog)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`story-trigger${className ? ` ${className}` : ""}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {label} <span aria-hidden="true">↗</span>
      </button>
      {open && (
        <div
          className="story-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            className="story-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            ref={dialogRef}
          >
            <div className="story-dialog-head">
              <div>
                <p className="eyebrow">
                  LOGLINE · {story.year ?? "D—TEAM"}
                  {story.status === "draft" ? " · DRAFT PREVIEW" : ""}
                </p>
                <h2 id={titleId}>{story.title}</h2>
              </div>
              <button className="story-close" type="button" onClick={() => setOpen(false)} aria-label="Close story">
                Close <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="story-tags">
              {story.categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
            <p className="story-logline">{story.logline}</p>
            <div className="story-synopsis">
              <h3>Short synopsis</h3>
              {story.synopsis.split("\n\n").filter(Boolean).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            <div className="story-dialog-foot">
              <span>D—TEAM STUDIO</span>
              <span>IDEAS INTO IMPACT.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
