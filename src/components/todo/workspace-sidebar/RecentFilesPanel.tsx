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
        <ul className="recent-list">
          {recentFiles.slice(0, 5).map((entry) => (
            <li key={entry.id}>
              <span>{entry.name}</span>
              <small>{entry.timestampLabel}</small>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}
