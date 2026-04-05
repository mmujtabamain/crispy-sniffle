import PanelSection from "../PanelSection";
import type { WorkspaceSummaryPanelProps } from "./types";

export default function WorkspaceSummaryPanel({
  title,
  updatedAtLabel,
}: WorkspaceSummaryPanelProps) {
  return (
    <PanelSection title="Workspace">
      <p className="text-sm text-[var(--ink-1)]">{title}</p>
      <p className="text-sm text-[var(--ink-1)]">Updated {updatedAtLabel}</p>
    </PanelSection>
  );
}
