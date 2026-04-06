import type { ChangeEvent, KeyboardEvent } from "react";
import { Sparkles } from "lucide-react";
import type { Todo } from "../../../lib/workspace";
import type { TodoComposerProps } from "./types";

export default function TodoComposer({
  inputRef,
  value,
  onChange,
  onSubmit,
}: TodoComposerProps) {
  return (
    <div className="bg-[var(--surface)] border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-2xl shadow-[var(--shadow)] p-3 grid grid-cols-[1fr_auto] gap-2">
      <label htmlFor="todo-input" className="sr-only">
        New todo
      </label>
      <div className="grid grid-cols-[minmax(220px,1fr)_repeat(3,minmax(0,180px))] gap-2">
        <input
          id="todo-input"
          ref={inputRef}
          value={value.text}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange({ text: event.target.value })
          }
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
          placeholder="Add a focused task, then press Enter"
        />

        <select
          value={value.priority}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange({ priority: event.target.value as Todo["priority"] })
          }
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
          <option value="critical">Critical priority</option>
        </select>

        <input
          type="date"
          value={value.dueDate}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange({ dueDate: event.target.value })
          }
          aria-label="Due date"
        />

        <input
          value={value.tags}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange({ tags: event.target.value })
          }
          placeholder="tags: launch, inbox"
          aria-label="Quick tags"
        />
      </div>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold bg-[var(--accent)] text-[var(--bg-0)] border border-[color-mix(in_oklch,var(--accent),black_20%)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onSubmit}
      >
        <Sparkles size={16} /> Add
      </button>
    </div>
  );
}
