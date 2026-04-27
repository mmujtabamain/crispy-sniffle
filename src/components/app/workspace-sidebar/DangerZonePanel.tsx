import { useState } from "react";
import { AlertTriangle, Eraser } from "lucide-react";
import PanelSection from "../PanelSection";
import type { DangerZonePanelProps } from "./types";

export default function DangerZonePanel({
  onClearLocalData,
}: DangerZonePanelProps) {
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onClearLocalData();
  }

  return (
    <PanelSection
      title="Danger Zone"
      className="border-[color-mix(in_oklch,var(--error)_45%,var(--line))]"
    >
      {confirming ? (
        <div className="grid gap-2">
          <div className="flex items-start gap-2 text-sm text-[var(--ink-1)]">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-[var(--error)]" />
            <span>This will clear all local workspace data, backups, and recent files. Cannot be undone.</span>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-white bg-[var(--error)] cursor-pointer transition-all hover:opacity-90"
              onClick={handleClick}
            >
              Yes, clear all
            </button>
            <button
              type="button"
              className="inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:bg-[color-mix(in_oklch,var(--surface),white_12%)]"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-[color-mix(in_oklch,var(--error),var(--ink-0)_24%)] border border-[color-mix(in_oklch,var(--error)_50%,var(--line))] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={handleClick}
        >
          <Eraser size={16} /> Clear local data
        </button>
      )}
    </PanelSection>
  );
}
