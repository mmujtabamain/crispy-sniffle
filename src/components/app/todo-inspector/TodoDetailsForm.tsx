import type { Todo } from "../../../lib/workspace";
import { toLinksString, toTagString } from "./helpers";

interface TodoDetailsFormProps {
  todo: Todo;
  onPatch: (todoId: string, patch: Partial<Todo>) => void;
}

type ChipOption = { value: string; label: string };

function ChipGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ChipOption[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value as T)}
          className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold transition-all ${
            value === opt.value
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "bg-[color-mix(in_oklch,var(--bg-1),transparent_30%)] text-[var(--ink-1)] border border-[color-mix(in_oklch,var(--line),transparent_30%)] hover:bg-[color-mix(in_oklch,var(--line),transparent_40%)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const PRIORITY_OPTIONS: ChipOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_OPTIONS: ChipOption[] = [
  { value: "todo", label: "Todo" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const RECURRENCE_OPTIONS: ChipOption[] = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function TodoDetailsForm({
  todo,
  onPatch,
}: TodoDetailsFormProps) {
  return (
    <>
      <label className="grid gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Title</span>
        <input
          value={todo.text}
          onChange={(event) => onPatch(todo.id, { text: event.target.value })}
          placeholder="Task title"
        />
      </label>

      <div className="grid gap-1.5">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Priority</span>
        <ChipGroup
          value={todo.priority}
          options={PRIORITY_OPTIONS}
          onChange={(v) => onPatch(todo.id, { priority: v })}
        />
      </div>

      <div className="grid gap-1.5">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Status</span>
        <ChipGroup
          value={todo.status}
          options={STATUS_OPTIONS}
          onChange={(v) => onPatch(todo.id, { status: v })}
        />
      </div>

      <div className="grid gap-1.5">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Recurring</span>
        <ChipGroup
          value={todo.recurrence}
          options={RECURRENCE_OPTIONS}
          onChange={(v) => onPatch(todo.id, { recurrence: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Due date</span>
          <input
            type="date"
            value={todo.dueDate || ""}
            onChange={(event) =>
              onPatch(todo.id, { dueDate: event.target.value || null })
            }
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Category</span>
          <input
            value={todo.category || ""}
            onChange={(event) =>
              onPatch(todo.id, { category: event.target.value })
            }
            placeholder="Category"
          />
        </label>
      </div>

      <label className="grid gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Tags</span>
        <input
          value={toTagString(todo.tags)}
          onChange={(event) =>
            onPatch(todo.id, {
              tags: event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
          placeholder="design, launch"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Est. minutes</span>
          <input
            type="number"
            min={0}
            value={todo.estimateMinutes ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              onPatch(todo.id, { estimateMinutes: next ? Number(next) : null });
            }}
            placeholder="25"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Actual minutes</span>
          <input
            type="number"
            min={0}
            value={todo.actualMinutes ?? 0}
            onChange={(event) => {
              const next = event.target.value;
              onPatch(todo.id, { actualMinutes: next ? Number(next) : 0 });
            }}
          />
        </label>
      </div>

      <label className="grid gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Description</span>
        <textarea
          rows={3}
          value={todo.description || ""}
          onChange={(event) =>
            onPatch(todo.id, { description: event.target.value })
          }
          placeholder="Short description"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Links (one URL per line)</span>
        <textarea
          rows={3}
          value={toLinksString(todo.links)}
          onChange={(event) =>
            onPatch(todo.id, {
              links: event.target.value
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
          placeholder="https://example.com"
        />
      </label>
    </>
  );
}
