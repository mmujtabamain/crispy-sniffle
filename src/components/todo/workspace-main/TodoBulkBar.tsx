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
    <div className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-[0.78rem] bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_22%)] p-2 flex gap-2 flex-wrap items-center">
      <strong>{selectedCount} selected</strong>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onSetHighPriority}
      >
        Set high priority
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onArchiveSelected}
      >
        Archive selected
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-[color-mix(in_oklch,var(--error),var(--ink-0)_24%)] border border-[color-mix(in_oklch,var(--error)_50%,var(--line))] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onDeleteSelected}
      >
        Delete selected
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onSelectVisible}
      >
        Select visible
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onClearSelection}
      >
        Clear selection
      </button>
    </div>
  );
}
