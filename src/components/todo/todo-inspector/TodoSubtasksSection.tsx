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
  return (
    <section className="border-t border-dashed border-[color-mix(in_oklch,var(--line),transparent_22%)] pt-2 grid gap-2">
      <div className="flex justify-between items-center gap-2">
        <h4>Subtasks</h4>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0 min-w-9 px-2"
          onClick={() => {
            const text = window.prompt("New subtask");
            if (text) {
              onAddSubtask(todo.id, text);
            }
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <ul className="list-none grid gap-2">
        {(todo.subtasks || []).map((subtask: Subtask) => (
          <li key={subtask.id}>
            <label>
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggleSubtask(todo.id, subtask.id)}
              />
              <span>{subtask.text}</span>
            </label>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-[color-mix(in_oklch,var(--error),var(--ink-0)_24%)] border border-[color-mix(in_oklch,var(--error)_50%,var(--line))] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
              onClick={() => onDeleteSubtask(todo.id, subtask.id)}
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
