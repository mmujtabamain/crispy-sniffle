import { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { CloudUpload } from "lucide-react";
import SortableTodoItem from "../SortableTodoItem";
import WorkspaceContextMenu from "../WorkspaceContextMenu";
import type {
  ContextAction,
  ContextMenuState,
} from "../../../features/workspace/types";
import type { TodoListPanelProps } from "./types";

export default function TodoListPanel({
  todos,
  selectedTodoIds,
  sensors,
  onDragEnd,
  dragDisabled,
  onToggleSelect,
  onToggle,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  onFocusTodo,
  onRenameTodo,
}: TodoListPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    if (editingId && !todos.some((todo) => todo.id === editingId)) {
      setEditingId(null);
      setEditingDraft("");
    }
  }, [editingId, todos]);

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null);
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    }

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("contextmenu", closeContextMenu);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("contextmenu", closeContextMenu);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  function beginEdit(todoId: string, currentText: string) {
    setEditingId(todoId);
    setEditingDraft(currentText);
    onFocusTodo(todoId);
  }

  function commitEdit(todoId: string) {
    const nextValue = editingDraft.trim();
    const didCommit = onRenameTodo(todoId, nextValue);
    if (!didCommit) {
      setEditingId(null);
      setEditingDraft("");
      return;
    }

    setEditingId(null);
    setEditingDraft("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingDraft("");
  }

  function openContextMenu(todoId: string, x: number, y: number) {
    setContextMenu({ todoId, x, y });
  }

  function handleContextAction(action: ContextAction, todoId: string) {
    setContextMenu(null);

    if (action === "select") {
      onToggleSelect(todoId);
      return;
    }
    if (action === "duplicate") {
      onDuplicate(todoId);
      return;
    }
    if (action === "archive") {
      onArchive(todoId);
      return;
    }
    if (action === "restore") {
      onRestore(todoId);
      return;
    }
    if (action === "delete") {
      onDelete(todoId);
    }
  }

  if (todos.length === 0) {
    return (
      <motion.div
        className="border border-dashed border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[color-mix(in_oklch,var(--surface),white_5%)] rounded-2xl min-h-[230px] grid place-content-center text-center gap-2 text-[var(--ink-1)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <CloudUpload size={24} />
        <h3>Your runway is clear</h3>
        <p>
          Use the composer, import panel, or saved filters to build your Tier 2
          workspace.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {dragDisabled ? (
        <p className="text-sm text-[var(--ink-1)]">
          Manual sorting is disabled because another sort mode is active.
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={todos.map((todo) => todo.id)}
          strategy={verticalListSortingStrategy}
        >
          <motion.ul className="list-none grid gap-2" layout>
            <AnimatePresence>
              {todos.map((todo) => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  isEditing={editingId === todo.id}
                  editDraft={editingDraft}
                  onDraftChange={setEditingDraft}
                  onBeginEdit={(targetTodo) =>
                    beginEdit(targetTodo.id, targetTodo.text)
                  }
                  onCommitEdit={() => commitEdit(todo.id)}
                  onCancelEdit={cancelEdit}
                  isSelected={selectedTodoIds.includes(todo.id)}
                  onSelect={onToggleSelect}
                  onToggle={onToggle}
                  onDuplicate={onDuplicate}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onDelete={onDelete}
                  onFocus={onFocusTodo}
                  onOpenContextMenu={openContextMenu}
                  dragDisabled={dragDisabled}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </SortableContext>
      </DndContext>

      <WorkspaceContextMenu menu={contextMenu} onAction={handleContextAction} />
    </>
  );
}
