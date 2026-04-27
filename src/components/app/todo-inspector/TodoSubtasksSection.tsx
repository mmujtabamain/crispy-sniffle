import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Subtask, Todo } from "../../../lib/workspace";

interface TodoSubtasksSectionProps {
  todo: Todo;
  onAddSubtask: (todoId: string, text: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

export default function TodoSubtasksSection({
  todo,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TodoSubtasksSectionProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpenAdd() {
    setAdding(true);
    setDraft("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleCommit() {
    const trimmed = draft.trim();
    if (trimmed) {
      onAddSubtask(todo.id, trimmed);
    }
    setAdding(false);
    setDraft("");
  }

  function handleCancel() {
    setAdding(false);
    setDraft("");
  }

  return (
    <section className="border-t border-dashed border-[color-mix(in_oklch,var(--line),transparent_22%)] pt-2 grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4>Subtasks</h4>
        {!adding && (
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:bg-[color-mix(in_oklch,var(--surface),white_12%)]"
            onClick={handleOpenAdd}
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-1.5 items-center">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommit();
              if (e.key === "Escape") handleCancel();
            }}
            placeholder="Subtask text"
            className="flex-1"
          />
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-semibold bg-[var(--accent)] text-white cursor-pointer transition-all hover:opacity-90"
            onClick={handleCommit}
          >
            Add
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-lg px-2 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:bg-[color-mix(in_oklch,var(--surface),white_12%)]"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}

      <ul className="grid gap-1.5 list-none">
        {(todo.subtasks || []).map((subtask: Subtask) => (
          <li key={subtask.id} className="flex items-center gap-2 group/subtask">
            <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggleSubtask(todo.id, subtask.id)}
              />
              <span className={`text-sm truncate ${subtask.completed ? "line-through text-[var(--ink-soft)]" : ""}`}>
                {subtask.text}
              </span>
            </label>
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--ink-soft)] hover:text-[var(--error)] hover:bg-[color-mix(in_oklch,var(--error)_12%,var(--surface))] opacity-0 group-hover/subtask:opacity-100 transition-all"
              onClick={() => onDeleteSubtask(todo.id, subtask.id)}
              aria-label="Delete subtask"
            >
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
