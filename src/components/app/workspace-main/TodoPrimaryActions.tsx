import { useState } from "react";
import { AlertTriangle, Archive, Check, Trash2 } from "lucide-react";
import type { TodoPrimaryActionsProps } from "./types";

export default function TodoPrimaryActions({
  onClearCompleted,
  onArchiveCompleted,
  onClearAll,
}: TodoPrimaryActionsProps) {
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onClearCompleted}
      >
        <Check size={15} /> Clear completed
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onArchiveCompleted}
      >
        <Archive size={15} /> Archive completed
      </button>

      {confirmingClearAll ? (
        <div className="flex items-center gap-1.5 rounded-xl border border-[color-mix(in_oklch,var(--error)_50%,var(--line))] bg-[color-mix(in_oklch,var(--error)_8%,var(--surface))] px-3 py-1.5">
          <AlertTriangle size={14} className="text-[var(--error)] shrink-0" />
          <span className="text-xs text-[var(--ink-1)]">Clear all todos?</span>
          <button
            type="button"
            className="inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold text-white bg-[var(--error)] cursor-pointer transition-all hover:opacity-90 ml-1"
            onClick={() => { setConfirmingClearAll(false); onClearAll(); }}
          >
            Yes
          </button>
          <button
            type="button"
            className="inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:bg-[color-mix(in_oklch,var(--surface),white_12%)]"
            onClick={() => setConfirmingClearAll(false)}
          >
            No
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={() => setConfirmingClearAll(true)}
        >
          <Trash2 size={15} /> Clear all
        </button>
      )}
    </div>
  );
}
