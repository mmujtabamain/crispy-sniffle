import PanelSection from "../PanelSection";
import type { WorkspaceSummaryPanelProps } from "./types";

export default function WorkspaceSummaryPanel({
  title,
  updatedAtLabel,
}: WorkspaceSummaryPanelProps) {
  return (
    <PanelSection title="Workspace">
      <p className="panel-copy">{title}</p>
      <p className="meta-line">Updated {updatedAtLabel}</p>
    </PanelSection>
  );
}
