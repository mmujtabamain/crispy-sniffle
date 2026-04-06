import type { ChangeEvent, KeyboardEvent } from "react";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import type { Todo } from "../../../lib/workspace";
import type { TodoComposerProps } from "./types";

export default function TodoComposer({
  inputRef,
  value,
  filtersOpen,
  activeFilterCount,
  onChange,
  onToggleFilters,
  onSubmit,
}: TodoComposerProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[var(--surface)] p-3 shadow-[var(--shadow)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <label htmlFor="todo-input" className="sr-only">
        New todo
      </label>
      <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(0,180px))]">
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border px-3 font-semibold transition-all hover:translate-y-[-1px] active:translate-y-0 ${
            filtersOpen
              ? "border-[color-mix(in_oklch,var(--accent),var(--line)_32%)] bg-[color-mix(in_oklch,var(--accent-soft)_72%,var(--surface))] text-[var(--ink-0)]"
              : "border-[var(--line)] bg-[var(--surface)]"
          }`}
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls="todo-filters-panel"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 ? (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--accent),white_16%)] px-1.5 py-0.5 text-[0.72rem] leading-none text-[var(--bg-0)]">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[color-mix(in_oklch,var(--accent),black_20%)] bg-[var(--accent)] px-3 font-semibold text-[var(--bg-0)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onSubmit}
        >
          <Sparkles size={16} /> Add
        </button>
      </div>
    </div>
  );
}
