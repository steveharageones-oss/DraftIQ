"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const href = typeof window !== "undefined" ? window.location.href : "";

  const copy = async () => {
    if (!href) return;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const nativeShare = async () => {
    if (!href || !navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: "DraftIQ — fantasy football draft assistant",
        text: "Track your draft and get AI next-pick advice.",
        url: href,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
      >
        ⇪ Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-50">Share DraftIQ</h3>
                <p className="mt-0.5 text-xs text-zinc-500">Scan the QR with a phone camera.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 transition hover:text-zinc-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
              <QRCodeSVG value={href} size={200} level="M" marginSize={1} />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                readOnly
                value={href}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 outline-none"
              />
              <button
                type="button"
                onClick={copy}
                className="shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>

            <button
              type="button"
              onClick={nativeShare}
              className="mt-3 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Share link…
            </button>
          </div>
        </div>
      )}
    </>
  );
}
