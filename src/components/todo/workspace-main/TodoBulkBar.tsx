import type { TodoBulkActionsProps } from "./types";

export default function TodoBulkBar({
  selectedCount,
  onSetHighPriority,
  onArchiveSelected,
  onDeleteSelected,
  onSelectVisible,
  onClearSelection,
}: TodoBulkActionsProps) {
  return (
    <div className="bulk-bar">
      <strong>{selectedCount} selected</strong>
      <button
        type="button"
        className="secondary-button"
        onClick={onSetHighPriority}
      >
        Set high priority
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={onArchiveSelected}
      >
        Archive selected
      </button>
      <button type="button" className="danger-button" onClick={onDeleteSelected}>
        Delete selected
      </button>
      <button type="button" className="secondary-button" onClick={onSelectVisible}>
        Select visible
      </button>
      <button type="button" className="secondary-button" onClick={onClearSelection}>
        Clear selection
      </button>
    </div>
  );
}
