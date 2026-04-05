import { Archive, Check, Trash2 } from "lucide-react";
import type { TodoPrimaryActionsProps } from "./types";

export default function TodoPrimaryActions({
  onClearCompleted,
  onArchiveCompleted,
  onClearAll,
}: TodoPrimaryActionsProps) {
  return (
    <div className="action-row">
      <button
        type="button"
        className="secondary-button"
        onClick={onClearCompleted}
      >
        <Check size={15} /> Clear completed
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={onArchiveCompleted}
      >
        <Archive size={15} /> Archive completed
      </button>
      <button type="button" className="secondary-button" onClick={onClearAll}>
        <Trash2 size={15} /> Clear all
      </button>
    </div>
  );
}
