import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Archive,
  Check,
  Copy,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import type { Todo } from "../../lib/workspace";

interface SortableTodoItemProps {
  todo: Todo;
  isEditing: boolean;
  editDraft: string;
  onDraftChange: (value: string) => void;
  onBeginEdit: (todo: Todo) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  isSelected: boolean;
  onSelect: (todoId: string) => void;
  onToggle: (todoId: string) => void;
  onDuplicate: (todoId: string) => void;
  onArchive: (todoId: string) => void;
  onRestore: (todoId: string) => void;
  onDelete: (todoId: string) => void;
  onFocus: (todoId: string) => void;
  onOpenContextMenu: (todoId: string, x: number, y: number) => void;
  onAddSubtask: (todoId: string, text: string) => void;
  dragDisabled: boolean;
}

export default function SortableTodoItem({
  todo,
  isEditing,
  editDraft,
  onDraftChange,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  isSelected,
  onSelect,
  onToggle,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  onFocus,
  onOpenContextMenu,
  onAddSubtask,
  dragDisabled,
}: SortableTodoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: todo.id,
      disabled: dragDisabled,
    });

  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleOpenSubtask(e: MouseEvent) {
    e.stopPropagation();
    setAddingSubtask(true);
    setSubtaskDraft("");
    window.setTimeout(() => subtaskInputRef.current?.focus(), 0);
  }

  function handleCommitSubtask() {
    const trimmed = subtaskDraft.trim();
    if (trimmed) {
      onAddSubtask(todo.id, trimmed);
    }
    setAddingSubtask(false);
    setSubtaskDraft("");
  }

  function handleCancelSubtask() {
    setAddingSubtask(false);
    setSubtaskDraft("");
  }

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`grid bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow)] group/todo ${todo.completed ? "opacity-62" : ""} ${todo.archived ? "opacity-62" : ""} ${isSelected ? "border-[color-mix(in_oklch,var(--accent)_55%,var(--line))]" : ""}`}
      onClick={() => onFocus(todo.id)}
      onContextMenu={(event: MouseEvent<HTMLLIElement>) => {
        event.preventDefault();
        onOpenContextMenu(todo.id, event.clientX, event.clientY);
      }}
    >
      {/* Main todo row */}
      <div className="grid grid-cols-[auto_auto_auto_1fr_auto] items-center gap-2 p-2">
        <label className="grid place-items-center" title="Select todo">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(todo.id)}
            aria-label={`Select ${todo.text}`}
          />
        </label>

        <button
          type="button"
          className="border-none bg-transparent cursor-grab text-[var(--ink-soft)] p-1 disabled:opacity-45 disabled:cursor-not-allowed active:cursor-grabbing"
          aria-label="Reorder todo"
          title={
            dragDisabled
              ? "Enable manual sort with no active filters to reorder"
              : "Drag to reorder"
          }
          disabled={dragDisabled}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>

        <label
          className="relative inline-flex items-center justify-center w-[1.34rem] h-[1.34rem]"
          title="Toggle complete"
        >
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            aria-label={`Mark ${todo.text} as ${todo.completed ? "incomplete" : "complete"}`}
          />
          <span
            className="absolute grid place-items-center pointer-events-none opacity-0 text-[var(--bg-0)] scale-90 transition-all [.todo-check-wrap_input:checked+&]:opacity-100 [.todo-check-wrap_input:checked+&]:scale-100"
            aria-hidden="true"
          >
            <Check size={14} />
          </span>
        </label>

        <div
          className="min-w-0 grid gap-1"
          onDoubleClick={() => onBeginEdit(todo)}
        >
          {isEditing ? (
            <input
              className="w-full"
              value={editDraft}
              onChange={(event) => onDraftChange(event.target.value)}
              onBlur={onCommitEdit}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  onCommitEdit();
                }
                if (event.key === "Escape") {
                  onCancelEdit();
                }
              }}
              autoFocus
              aria-label="Edit todo text"
            />
          ) : (
            <button
              type="button"
              className="block border-none bg-transparent w-full text-left cursor-text min-w-0"
              onClick={() => onBeginEdit(todo)}
            >
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                {todo.text}
              </span>
            </button>
          )}

          <div className="flex gap-1 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-[var(--line)] text-xs text-[var(--ink-1)] ${
                todo.priority === "low"
                  ? "bg-[color-mix(in_oklch,var(--success)_15%,var(--surface))]"
                  : todo.priority === "medium"
                    ? "bg-[color-mix(in_oklch,var(--warning)_18%,var(--surface))]"
                    : todo.priority === "high"
                      ? "bg-[color-mix(in_oklch,var(--accent)_16%,var(--surface))]"
                      : todo.priority === "critical"
                        ? "bg-[color-mix(in_oklch,var(--error)_20%,var(--surface))]"
                        : ""
              }`}
            >
              {todo.priority}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-[var(--line)] text-xs text-[var(--ink-1)] bg-[color-mix(in_oklch,var(--surface),white_8%)] dark:bg-[color-mix(in_oklch,var(--surface),black_18%)]">
              {todo.status}
            </span>
            {todo.dueDate && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-[var(--line)] text-xs text-[var(--ink-1)] bg-[color-mix(in_oklch,var(--surface),white_8%)] dark:bg-[color-mix(in_oklch,var(--surface),black_18%)]">
                Due {todo.dueDate}
              </span>
            )}
            {todo.tags.slice(0, 3).map((tag: string) => (
              <span
                key={`${todo.id}-${tag}`}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-[var(--line)] text-xs text-[var(--ink-1)] bg-[color-mix(in_oklch,var(--surface),white_8%)] dark:bg-[color-mix(in_oklch,var(--surface),black_18%)]"
              >
                #{tag}
              </span>
            ))}
            {todo.tags?.length > 3 && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-[var(--line)] text-xs text-[var(--ink-1)] bg-[color-mix(in_oklch,var(--surface),white_8%)] dark:bg-[color-mix(in_oklch,var(--surface),black_18%)]">
                +{todo.tags.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="inline-flex gap-1.5 items-center">
          {/* Hover-only add subtask button */}
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-2.5 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0 opacity-0 group-hover/todo:opacity-100"
            onClick={handleOpenSubtask}
            aria-label="Add subtask"
            title="Add subtask"
          >
            <Plus size={13} />
          </button>

          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={(e: MouseEvent) => { e.stopPropagation(); onDuplicate(todo.id); }}
            aria-label="Duplicate todo"
          >
            <Copy size={15} />
          </button>

          {todo.archived ? (
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
              onClick={(e: MouseEvent) => { e.stopPropagation(); onRestore(todo.id); }}
              aria-label="Restore todo"
            >
              <RotateCcw size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
              onClick={(e: MouseEvent) => { e.stopPropagation(); onArchive(todo.id); }}
              aria-label="Archive todo"
            >
              <Archive size={15} />
            </button>
          )}

          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-[color-mix(in_oklch,var(--error),var(--ink-0)_24%)] border border-[color-mix(in_oklch,var(--error)_50%,var(--line))] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={(e: MouseEvent) => { e.stopPropagation(); onDelete(todo.id); }}
            aria-label="Delete todo"
          >
            <Trash2 size={15} />
          </button>

          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              onOpenContextMenu(
                todo.id,
                rect.left + rect.width / 2,
                rect.bottom + 8,
              );
            }}
            aria-label="More actions"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Inline subtask composer (shown on + click) */}
      {addingSubtask && (
        <div className="flex gap-1.5 items-center px-2 pb-2 pl-[calc(0.5rem+1.34rem+1.34rem+2.5rem)]">
          <div className="w-px h-5 bg-[color-mix(in_oklch,var(--line),transparent_20%)] shrink-0" />
          <input
            ref={subtaskInputRef}
            value={subtaskDraft}
            onChange={(e) => setSubtaskDraft(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") handleCommitSubtask();
              if (e.key === "Escape") handleCancelSubtask();
            }}
            placeholder="Subtask text"
            className="flex-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-semibold bg-[var(--accent)] text-white cursor-pointer transition-all hover:opacity-90 shrink-0"
            onClick={(e) => { e.stopPropagation(); handleCommitSubtask(); }}
          >
            Add
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-lg px-2 text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:bg-[color-mix(in_oklch,var(--surface),white_12%)] shrink-0"
            onClick={(e) => { e.stopPropagation(); handleCancelSubtask(); }}
          >
            Cancel
          </button>
        </div>
      )}
    </motion.li>
  );
}
