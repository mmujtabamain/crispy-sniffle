import { Archive, Check, Trash2 } from "lucide-react";
import type { TodoPrimaryActionsProps } from "./types";

export default function TodoPrimaryActions({
  onClearCompleted,
  onArchiveCompleted,
  onClearAll,
}: TodoPrimaryActionsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
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
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onClearAll}
      >
        <Trash2 size={15} /> Clear all
      </button>
    </div>
  );
}
