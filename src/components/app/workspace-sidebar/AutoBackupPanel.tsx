import PanelSection from "../PanelSection";
import type { AutoBackupPanelProps } from "./types";

const INTERVAL_OPTIONS = [
  { value: 1, label: "1 min" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
];

export default function AutoBackupPanel({
  autosaveMinutes,
  backupsCount,
  onAutosaveChange,
}: AutoBackupPanelProps) {
  return (
    <PanelSection title="Auto-Backup">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
        Snapshot interval
      </span>
      <div className="flex flex-wrap gap-1.5">
        {INTERVAL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAutosaveChange(opt.value)}
            className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold transition-all ${
              autosaveMinutes === opt.value
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "bg-[color-mix(in_oklch,var(--bg-1),transparent_30%)] text-[var(--ink-1)] border border-[color-mix(in_oklch,var(--line),transparent_30%)] hover:bg-[color-mix(in_oklch,var(--line),transparent_40%)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-[var(--ink-1)]">
        {backupsCount} local snapshots retained
      </p>
    </PanelSection>
  );
}
