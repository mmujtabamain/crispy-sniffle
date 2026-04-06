import type { ChangeEvent } from "react";
import { Filter, X } from "lucide-react";
import type { TodoFiltersPanelProps } from "./types";

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
  return (
    <div className="bg-[var(--surface)] border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-2xl shadow-[var(--shadow)] p-2 grid gap-2">
      <div className="flex justify-between items-center gap-2">
        <h3>
          <Filter size={16} /> Filters & Sorting
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onSaveCurrentFilters}
          >
            Save current filter
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onClearFilters}
          >
            <X size={14} /> Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label>
          Completion
          <select
            value={filters.completion}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onFilterChange("completion", event.target.value)
            }
          >
            <option value="active">Active only</option>
            <option value="completed">Completed only</option>
            <option value="pending">Pending only</option>
            <option value="archived">Archived only</option>
            <option value="all">All statuses</option>
          </select>
        </label>

        <label>
          Priority
          <select
            value={filters.priority}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onFilterChange("priority", event.target.value)
            }
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={filters.status}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onFilterChange("status", event.target.value)
            }
          >
            <option value="all">All statuses</option>
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>

        <label>
          Smart filter
          <select
            value={filters.smartFilter}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onFilterChange("smartFilter", event.target.value)
            }
          >
            <option value="none">None</option>
            <option value="today">Today</option>
            <option value="overdue">Overdue</option>
            <option value="thisWeek">This week</option>
          </select>
        </label>

        <label>
          Search text
          <input
            value={filters.searchText}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFilterChange("searchText", event.target.value)
            }
            placeholder="Search todos and notes"
          />
        </label>

        <label>
          Search tag
          <input
            value={filters.searchTag}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFilterChange("searchTag", event.target.value)
            }
            placeholder="tag name"
          />
        </label>

        <label>
          Date start
          <input
            type="date"
            value={filters.startDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFilterChange("startDate", event.target.value)
            }
          />
        </label>

        <label>
          Date end
          <input
            type="date"
            value={filters.endDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFilterChange("endDate", event.target.value)
            }
          />
        </label>

        <label>
          Sort
          <select
            value={filters.sortBy}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onFilterChange("sortBy", event.target.value)
            }
          >
            <option value="manual">Manual order</option>
            <option value="created-desc">Created newest</option>
            <option value="created-asc">Created oldest</option>
            <option value="due-asc">Due date</option>
            <option value="priority-desc">Priority</option>
            <option value="alpha-asc">Alphabetical</option>
          </select>
        </label>

        <label>
          Saved presets
          <select
            value=""
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              if (!event.target.value) {
                return;
              }
              onApplySavedFilter(event.target.value);
            }}
          >
            <option value="">Apply preset…</option>
            {savedFilters.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tag-toggle-row">
        {availableTags.map((tag) => {
          const isActive = filters.tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={`chip-button ${isActive ? "active" : ""}`}
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

      {savedFilters.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {savedFilters.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="chip-button"
              onClick={() => onDeleteSavedFilter(preset.id)}
            >
              Delete {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
