"use client";

import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this delivery link", url);
    }
  }

  return (
    <button className="copy-link-button" type="button" onClick={copy}>
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
