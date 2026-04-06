import PanelSection from "../PanelSection";
import type { AutoBackupPanelProps } from "./types";

export default function AutoBackupPanel({
  autosaveMinutes,
  backupsCount,
  onAutosaveChange,
}: AutoBackupPanelProps) {
  return (
    <PanelSection title="Auto-Backup">
      <label
        htmlFor="autosave-select"
        className="text-[0.83rem] text-[var(--ink-soft)]"
      >
        Snapshot interval
      </label>
      <select
        id="autosave-select"
        value={autosaveMinutes}
        onChange={(event) => onAutosaveChange(Number(event.target.value))}
      >
        <option value={1}>1 minute</option>
        <option value={5}>5 minutes</option>
        <option value={10}>10 minutes</option>
      </select>
      <p className="text-sm text-[var(--ink-1)]">
        {backupsCount} local snapshots retained
      </p>
    </PanelSection>
  );
}
