import { Eraser } from "lucide-react";
import PanelSection from "../PanelSection";
import type { DangerZonePanelProps } from "./types";

export default function DangerZonePanel({
  onClearLocalData,
}: DangerZonePanelProps) {
  return (
    <PanelSection title="Danger Zone" className="border-[color-mix(in_oklch,var(--error)_45%,var(--line))]">
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-[color-mix(in_oklch,var(--error),var(--ink-0)_24%)] border border-[color-mix(in_oklch,var(--error)_50%,var(--line))] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onClearLocalData}
      >
        <Eraser size={16} /> Clear local data
      </button>
    </PanelSection>
  );
}
