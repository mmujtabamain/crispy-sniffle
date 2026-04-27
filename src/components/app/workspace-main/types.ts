import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import type { ComponentProps, MutableRefObject } from "react";
import type { TodoFilters } from "../../../lib/todo-filters";
import type { Todo } from "../../../lib/workspace";
import type {
  QuotaStatus,
  SavedFilterPreset,
} from "../../../features/workspace/types";
import type { TodoInspectorProps } from "../TodoInspector";

export interface WorkspaceAlertsProps {
  quotaStatus: QuotaStatus;
  errorMessage: string;
}

export interface TodoComposerDraft {
  text: string;
  priority: Todo["priority"];
  dueDate: string;
  tags: string;
}

export interface TodoComposerProps {
  inputRef: MutableRefObject<HTMLInputElement | null>;
  value: TodoComposerDraft;
  filtersOpen: boolean;
  activeFilterCount: number;
  onChange: (patch: Partial<TodoComposerDraft>) => void;
  onToggleFilters: () => void;
  onSubmit: () => void;
}

export interface TodoFiltersPanelProps {
  open: boolean;
  filters: TodoFilters;
  availableTags: string[];
  savedFilters: SavedFilterPreset[];
  onFilterChange: (key: keyof TodoFilters, value: string | string[]) => void;
  onClearFilters: () => void;
  onSaveCurrentFilters: (name: string) => void;
  onApplySavedFilter: (presetId: string) => void;
  onDeleteSavedFilter: (presetId: string) => void;
}

export interface TodoStatsRowProps {
  visibleCount: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  archivedCount: number;
  activeListName: string;
  storageUsedLabel: string;
}

export interface TodoPrimaryActionsProps {
  onClearCompleted: () => void;
  onArchiveCompleted: () => void;
  onClearAll: () => void;
}

export interface TodoBulkActionsProps {
  selectedCount: number;
  onSetHighPriority: () => void;
  onArchiveSelected: () => void;
  onDeleteSelected: () => void;
  onSelectVisible: () => void;
  onClearSelection: () => void;
}

export interface TodoListPanelProps {
  todos: Todo[];
  selectedTodoIds: string[];
  sensors: ComponentProps<typeof DndContext>["sensors"];
  onDragEnd: (event: DragEndEvent) => void;
  dragDisabled: boolean;
  onToggleSelect: (todoId: string) => void;
  onToggle: (todoId: string) => void;
  onDuplicate: (todoId: string) => void;
  onArchive: (todoId: string) => void;
  onRestore: (todoId: string) => void;
  onDelete: (todoId: string) => void;
  onFocusTodo: (todoId: string | null) => void;
  onRenameTodo: (todoId: string, nextText: string) => boolean;
  onAddSubtask: (todoId: string, text: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

export interface WorkspaceMainProps {
  alerts: WorkspaceAlertsProps;
  composer: TodoComposerProps;
  filtersPanel: TodoFiltersPanelProps;
  stats: TodoStatsRowProps;
  primaryActions: TodoPrimaryActionsProps;
  bulkActions: TodoBulkActionsProps | null;
  todoList: TodoListPanelProps;
  inspector: TodoInspectorProps;
}
