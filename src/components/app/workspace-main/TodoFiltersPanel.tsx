import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { BookmarkCheck, X } from "lucide-react";
import type { TodoFiltersPanelProps } from "./types";

type ChipOption = { value: string; label: string };

function ChipGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ChipOption[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
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

const COMPLETION_OPTIONS: ChipOption[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const PRIORITY_OPTIONS: ChipOption[] = [
  { value: "all", label: "All" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_OPTIONS: ChipOption[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const SMART_OPTIONS: ChipOption[] = [
  { value: "none", label: "None" },
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "thisWeek", label: "This week" },
];

const SORT_OPTIONS: ChipOption[] = [
  { value: "manual", label: "Manual" },
  { value: "created-desc", label: "Newest" },
  { value: "created-asc", label: "Oldest" },
  { value: "due-asc", label: "Due date" },
  { value: "priority-desc", label: "Priority" },
  { value: "alpha-asc", label: "A-Z" },
];

export default function TodoFiltersPanel({
  filters,
  availableTags,
  savedFilters,
  onFilterChange,
  onClearFilters,
  onSaveCurrentFilters,
  onApplySavedFilter,
  onDeleteSavedFilter,
}: TodoFiltersPanelProps) {
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const presetInputRef = useRef<HTMLInputElement>(null);

  function handleOpenSave() {
    setSavingPreset(true);
    setPresetName(`Preset ${savedFilters.length + 1}`);
    window.setTimeout(() => {
      presetInputRef.current?.select();
    }, 0);
  }

  function handleCommitSave() {
    const name = presetName.trim();
    if (name) {
      onSaveCurrentFilters(name);
    }
    setSavingPreset(false);
    setPresetName("");
  }

  function handleCancelSave() {
    setSavingPreset(false);
    setPresetName("");
  }

  return (
    <div className="bg-[var(--surface)] border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-2xl shadow-[var(--shadow)] p-4 grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
          Filters & Sort
        </span>
        {savingPreset ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={presetInputRef}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommitSave();
                if (e.key === "Escape") handleCancelSave();
              }}
              placeholder="Preset name"
              className="h-7 text-xs px-2 rounded-lg border border-[var(--line)] bg-[var(--surface)]"
              style={{ width: "120px" }}
            />
            <button
              type="button"
              className="inline-flex h-7 items-center rounded-lg px-2 text-xs font-semibold bg-[var(--accent)] text-white cursor-pointer transition-all hover:opacity-90"
              onClick={handleCommitSave}
            >
              Save
            </button>
            <button
              type="button"
              className="inline-flex h-7 items-center rounded-lg px-2 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:bg-[color-mix(in_oklch,var(--surface),white_12%)]"
              onClick={handleCancelSave}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:bg-[color-mix(in_oklch,var(--surface),white_12%)]"
              onClick={handleOpenSave}
            >
              <BookmarkCheck size={12} />
              Save
            </button>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:bg-[color-mix(in_oklch,var(--surface),white_12%)]"
              onClick={onClearFilters}
            >
              <X size={12} />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Completion · Priority · Status */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Completion
          </span>
          <ChipGroup
            value={filters.completion}
            options={COMPLETION_OPTIONS}
            onChange={(v) => onFilterChange("completion", v)}
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Priority
          </span>
          <ChipGroup
            value={filters.priority}
            options={PRIORITY_OPTIONS}
            onChange={(v) => onFilterChange("priority", v)}
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Status
          </span>
          <ChipGroup
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(v) => onFilterChange("status", v)}
          />
        </div>
      </div>

      {/* Quick date · Sort */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Quick date
          </span>
          <ChipGroup
            value={filters.smartFilter}
            options={SMART_OPTIONS}
            onChange={(v) => onFilterChange("smartFilter", v)}
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Sort by
          </span>
          <ChipGroup
            value={filters.sortBy}
            options={SORT_OPTIONS}
            onChange={(v) => onFilterChange("sortBy", v)}
          />
        </div>
      </div>

      {/* Search + Date range */}
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Search text
          </span>
          <input
            value={filters.searchText}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFilterChange("searchText", event.target.value)
            }
            placeholder="Search todos and notes"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Search tag
          </span>
          <input
            value={filters.searchTag}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFilterChange("searchTag", event.target.value)
            }
            placeholder="tag name"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            From
          </span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFilterChange("startDate", event.target.value)
            }
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            To
          </span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFilterChange("endDate", event.target.value)
            }
          />
        </label>
      </div>

      {/* Tag toggles */}
      {availableTags.length > 0 && (
        <div className="grid gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isActive = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "bg-[color-mix(in_oklch,var(--bg-1),transparent_30%)] text-[var(--ink-1)] border border-[color-mix(in_oklch,var(--line),transparent_30%)] hover:bg-[color-mix(in_oklch,var(--line),transparent_40%)]"
                  }`}
                  onClick={() => {
                    const next = isActive
                      ? filters.tags.filter((entry) => entry !== tag)
                      : [...filters.tags, tag];
                    onFilterChange("tags", next);
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved presets */}
      {savedFilters.length > 0 && (
        <div className="grid gap-1.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Saved presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {savedFilters.map((preset) => (
              <div
                key={preset.id}
                className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] overflow-hidden"
              >
                <button
                  type="button"
                  className="pl-3 pr-2 py-1 text-xs font-semibold text-[var(--ink-1)] hover:text-[var(--ink-0)] transition-colors"
                  onClick={() => onApplySavedFilter(preset.id)}
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  className="pr-2 py-1 text-[var(--ink-soft)] hover:text-[var(--error)] transition-colors"
                  onClick={() => onDeleteSavedFilter(preset.id)}
                  aria-label={`Delete ${preset.name}`}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
