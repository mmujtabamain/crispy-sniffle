import { Eraser } from "lucide-react";
import PanelSection from "../PanelSection";
import type { DangerZonePanelProps } from "./types";

export default function DangerZonePanel({
  onClearLocalData,
}: DangerZonePanelProps) {
  return (
    <PanelSection title="Danger Zone" className="danger-panel">
      <button
        type="button"
        className="danger-button"
        onClick={onClearLocalData}
      >
        <Eraser size={16} /> Clear local data
      </button>
    </PanelSection>
  );
}
