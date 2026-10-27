"use client";

export function PrintButton() {
  return (
    <button className="print-button" type="button" onClick={() => window.print()}>
      Print / save as PDF <span aria-hidden="true">↗</span>
    </button>
  );
}
