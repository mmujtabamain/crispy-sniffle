import PanelSection from "../PanelSection";
import type { RecentFilesPanelProps } from "./types";

export default function RecentFilesPanel({
  recentFiles,
}: RecentFilesPanelProps) {
  return (
    <PanelSection title="Recent Files">
      {recentFiles.length === 0 ? (
        <p className="text-sm text-[var(--ink-1)]">No recent files yet.</p>
      ) : (
        <ul className="grid gap-1 list-none">
          {recentFiles.slice(0, 5).map((entry) => (
            <li key={entry.id} className="flex items-baseline justify-between gap-2 py-1 border-b border-[color-mix(in_oklch,var(--line),transparent_40%)] last:border-0">
              <span className="text-sm truncate">{entry.name}</span>
              <small className="text-[var(--ink-soft)] text-xs shrink-0">{entry.timestampLabel}</small>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}
