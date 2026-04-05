import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  Check,
  CloudUpload,
  Filter,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type {
  ChangeEvent,
  ComponentProps,
  KeyboardEvent,
  MutableRefObject,
} from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import SortableTodoItem from "./SortableTodoItem";
import TodoInspector from "./TodoInspector";
import type { Todo } from "../../lib/workspace";
import type { TodoFilters } from "../../lib/todo-filters";
import { formatBytes } from "../../lib/formatters";

interface QuotaStatus {
  usedBytes: number;
  quotaBytes: number;
  warning: boolean;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: TodoFilters;
}

interface TimerState {
  todoId: string | null;
  running: boolean;
  remainingSec: number;
}

interface WorkspaceMainProps {
  composerInputRef: MutableRefObject<HTMLInputElement | null>;
  quotaStatus: QuotaStatus;
  errorMessage: string;
  activeListName: string;
  newTodoText: string;
  onNewTodoTextChange: (value: string) => void;
  onComposerEnter: () => void;
  onAddTodo: () => void;
  quickPriority: Todo["priority"];
  onQuickPriorityChange: (value: Todo["priority"]) => void;
  quickDueDate: string;
  onQuickDueDateChange: (value: string) => void;
  quickTags: string;
  onQuickTagsChange: (value: string) => void;
  todos: Todo[];
  allListTodosCount: number;
  completedCount: number;
  pendingCount: number;
  archivedCount: number;
  selectedTodoIds: string[];
  onToggleSelect: (todoId: string) => void;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onClearCompleted: () => void;
  onArchiveCompleted: () => void;
  onClearAll: () => void;
  filters: TodoFilters;
  onFilterChange: (key: keyof TodoFilters, value: string | string[]) => void;
  onClearFilters: () => void;
  availableTags: string[];
  savedFilters: SavedFilter[];
  onSaveCurrentFilters: () => void;
  onApplySavedFilter: (presetId: string) => void;
  onDeleteSavedFilter: (presetId: string) => void;
  sensors: ComponentProps<typeof DndContext>["sensors"];
  onDragEnd: (event: DragEndEvent) => void;
  dragDisabled: boolean;
  editingId: string | null;
  editingDraft: string;
  onDraftChange: (value: string) => void;
  onBeginEdit: (todo: Todo) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onToggle: (todoId: string) => void;
  onDuplicate: (todoId: string) => void;
  onArchive: (todoId: string) => void;
  onRestore: (todoId: string) => void;
  onDelete: (todoId: string) => void;
  onOpenContextMenu: (todoId: string, x: number, y: number) => void;
  focusedTodo: Todo | null;
  timer: TimerState;
  onPatchTodo: (todoId: string, patch: Partial<Todo>) => void;
  onAddSubtask: (todoId: string, text: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  onAttachFiles: (todoId: string, files: File[]) => Promise<void>;
  onStartTimer: (todoId: string) => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
  onBulkSetPriority: (priority: Todo["priority"]) => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onFocusTodo: (todoId: string | null) => void;
}

export default function WorkspaceMain(props: WorkspaceMainProps) {
  const isAnyFilterActive =
    props.filters.completion !== "active" ||
    props.filters.priority !== "all" ||
    props.filters.status !== "all" ||
    props.filters.startDate ||
    props.filters.endDate ||
    props.filters.tags.length > 0 ||
    props.filters.searchText ||
    props.filters.searchTag ||
    props.filters.smartFilter !== "none" ||
    props.filters.sortBy !== "manual";

  return (
    <main className="workspace-main">
      {props.quotaStatus.warning && (
        <div className="warning-banner" role="status">
          <AlertTriangle size={17} />
          <span>
            Storage warning: {formatBytes(props.quotaStatus.usedBytes)} used of
            about {formatBytes(props.quotaStatus.quotaBytes)}.
          </span>
        </div>
      )}

      {props.errorMessage && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={17} />
          <span>{props.errorMessage}</span>
        </div>
      )}

      <div className="composer-row">
        <label htmlFor="todo-input" className="sr-only">
          New todo
        </label>
        <div className="composer-input-grid">
          <input
            id="todo-input"
            ref={props.composerInputRef}
            value={props.newTodoText}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              props.onNewTodoTextChange(event.target.value)
            }
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") {
                props.onComposerEnter();
              }
            }}
            placeholder="Add a focused task, then press Enter"
          />

          <select
            value={props.quickPriority}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              props.onQuickPriorityChange(
                event.target.value as Todo["priority"],
              )
            }
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
            <option value="critical">Critical priority</option>
          </select>

          <input
            type="date"
            value={props.quickDueDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              props.onQuickDueDateChange(event.target.value)
            }
            aria-label="Due date"
          />

          <input
            value={props.quickTags}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              props.onQuickTagsChange(event.target.value)
            }
            placeholder="tags: launch, inbox"
            aria-label="Quick tags"
          />
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={props.onAddTodo}
        >
          <Sparkles size={16} /> Add
        </button>
      </div>

      <div className="filter-panel">
        <div className="panel-headline-row">
          <h3>
            <Filter size={16} /> Filters & Sorting
          </h3>
          <div className="inline-row">
            <button
              type="button"
              className="secondary-button"
              onClick={props.onSaveCurrentFilters}
            >
              Save current filter
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={props.onClearFilters}
            >
              <X size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="filter-grid">
          <label>
            Completion
            <select
              value={props.filters.completion}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                props.onFilterChange("completion", event.target.value)
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
              value={props.filters.priority}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                props.onFilterChange("priority", event.target.value)
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
              value={props.filters.status}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                props.onFilterChange("status", event.target.value)
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
              value={props.filters.smartFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                props.onFilterChange("smartFilter", event.target.value)
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
              value={props.filters.searchText}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                props.onFilterChange("searchText", event.target.value)
              }
              placeholder="Search todos and notes"
            />
          </label>

          <label>
            Search tag
            <input
              value={props.filters.searchTag}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                props.onFilterChange("searchTag", event.target.value)
              }
              placeholder="tag name"
            />
          </label>

          <label>
            Date start
            <input
              type="date"
              value={props.filters.startDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                props.onFilterChange("startDate", event.target.value)
              }
            />
          </label>

          <label>
            Date end
            <input
              type="date"
              value={props.filters.endDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                props.onFilterChange("endDate", event.target.value)
              }
            />
          </label>

          <label>
            Sort
            <select
              value={props.filters.sortBy}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                props.onFilterChange("sortBy", event.target.value)
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
                props.onApplySavedFilter(event.target.value);
              }}
            >
              <option value="">Apply preset…</option>
              {props.savedFilters.map((preset: SavedFilter) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tag-toggle-row">
          {props.availableTags.map((tag: string) => {
            const isActive = props.filters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`chip-button ${isActive ? "active" : ""}`}
                onClick={() => {
                  const next = isActive
                    ? props.filters.tags.filter(
                        (entry: string) => entry !== tag,
                      )
                    : [...props.filters.tags, tag];
                  props.onFilterChange("tags", next);
                }}
              >
                #{tag}
              </button>
            );
          })}
        </div>

        {props.savedFilters.length > 0 && (
          <div className="saved-filter-row">
            {props.savedFilters.map((preset: SavedFilter) => (
              <button
                key={preset.id}
                type="button"
                className="chip-button"
                onClick={() => props.onDeleteSavedFilter(preset.id)}
              >
                Delete {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="stats-row" aria-label="Todo counters">
        <div>
          <strong>{props.todos.length}</strong>
          <span>Visible</span>
        </div>
        <div>
          <strong>{props.allListTodosCount}</strong>
          <span>In {props.activeListName || "list"}</span>
        </div>
        <div>
          <strong>{props.completedCount}</strong>
          <span>Completed</span>
        </div>
        <div>
          <strong>{props.pendingCount}</strong>
          <span>Open</span>
        </div>
        <div>
          <strong>{props.archivedCount}</strong>
          <span>Archived</span>
        </div>
        <div>
          <strong>{formatBytes(props.quotaStatus.usedBytes)}</strong>
          <span>Storage used</span>
        </div>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="secondary-button"
          onClick={props.onClearCompleted}
        >
          <Check size={15} /> Clear completed
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={props.onArchiveCompleted}
        >
          <Archive size={15} /> Archive completed
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={props.onClearAll}
        >
          <Trash2 size={15} /> Clear all
        </button>
      </div>

      {props.selectedTodoIds.length > 0 && (
        <div className="bulk-bar">
          <strong>{props.selectedTodoIds.length} selected</strong>
          <button
            type="button"
            className="secondary-button"
            onClick={() => props.onBulkSetPriority("high")}
          >
            Set high priority
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={props.onBulkArchive}
          >
            Archive selected
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={props.onBulkDelete}
          >
            Delete selected
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={props.onSelectAllFiltered}
          >
            Select visible
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={props.onClearSelection}
          >
            Clear selection
          </button>
        </div>
      )}

      {props.dragDisabled && !isAnyFilterActive && (
        <p className="meta-line">
          Manual sorting is disabled because another sort mode is active.
        </p>
      )}

      {props.todos.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <CloudUpload size={24} />
          <h3>Your runway is clear</h3>
          <p>
            Use the composer, import panel, or saved filters to build your Tier
            2 workspace.
          </p>
        </motion.div>
      ) : (
        <DndContext
          sensors={props.sensors}
          collisionDetection={closestCenter}
          onDragEnd={props.onDragEnd}
        >
          <SortableContext
            items={props.todos.map((todo: Todo) => todo.id)}
            strategy={verticalListSortingStrategy}
          >
            <motion.ul className="todo-list" layout>
              <AnimatePresence>
                {props.todos.map((todo: Todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    isEditing={props.editingId === todo.id}
                    editDraft={props.editingDraft}
                    onDraftChange={props.onDraftChange}
                    onBeginEdit={props.onBeginEdit}
                    onCommitEdit={props.onCommitEdit}
                    onCancelEdit={props.onCancelEdit}
                    isSelected={props.selectedTodoIds.includes(todo.id)}
                    onSelect={props.onToggleSelect}
                    onToggle={props.onToggle}
                    onDuplicate={props.onDuplicate}
                    onArchive={props.onArchive}
                    onRestore={props.onRestore}
                    onDelete={props.onDelete}
                    onFocus={props.onFocusTodo}
                    onOpenContextMenu={props.onOpenContextMenu}
                    dragDisabled={props.dragDisabled}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          </SortableContext>
        </DndContext>
      )}

      <TodoInspector
        todo={props.focusedTodo}
        timer={props.timer}
        onPatch={props.onPatchTodo}
        onAddSubtask={props.onAddSubtask}
        onToggleSubtask={props.onToggleSubtask}
        onDeleteSubtask={props.onDeleteSubtask}
        onAttachFiles={props.onAttachFiles}
        onStartTimer={props.onStartTimer}
        onStopTimer={props.onStopTimer}
        onResetTimer={props.onResetTimer}
      />

      <footer className="shortcut-strip">
        <span>Shortcuts:</span>
        <kbd>Cmd/Ctrl + N</kbd>
        <kbd>Cmd/Ctrl + S</kbd>
        <kbd>Cmd/Ctrl + Shift + S</kbd>
        <kbd>Cmd/Ctrl + O</kbd>
        <kbd>Cmd/Ctrl + Z</kbd>
        <kbd>Cmd/Ctrl + Shift + Z</kbd>
      </footer>
    </main>
  );
}
