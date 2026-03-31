import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, CloudUpload, Sparkles, Trash2 } from 'lucide-react';
import SortableTodoItem from './SortableTodoItem';

export default function WorkspaceMain({
  composerInputRef,
  quotaStatus,
  formatBytes,
  errorMessage,
  newTodoText,
  onNewTodoTextChange,
  onComposerEnter,
  onAddTodo,
  todos,
  completedCount,
  pendingCount,
  onClearCompleted,
  onClearAll,
  sensors,
  onDragEnd,
  editingId,
  editingDraft,
  onDraftChange,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onToggle,
  onDuplicate,
  onDelete
}) {
  return (
    <main className="workspace-main">
      {quotaStatus.warning && (
        <div className="warning-banner" role="status">
          <AlertTriangle size={17} />
          <span>
            Storage warning: {formatBytes(quotaStatus.usedBytes)} used of about {formatBytes(quotaStatus.quotaBytes)}.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={17} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="composer-row">
        <label htmlFor="todo-input" className="sr-only">
          New todo
        </label>
        <input
          id="todo-input"
          ref={composerInputRef}
          value={newTodoText}
          onChange={(event) => onNewTodoTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onComposerEnter();
            }
          }}
          placeholder="Add a focused task, then press Enter"
        />
        <button type="button" className="primary-button" onClick={onAddTodo}>
          <Sparkles size={16} /> Add
        </button>
      </div>

      <div className="stats-row" aria-label="Todo counters">
        <div>
          <strong>{todos.length}</strong>
          <span>Total</span>
        </div>
        <div>
          <strong>{completedCount}</strong>
          <span>Completed</span>
        </div>
        <div>
          <strong>{pendingCount}</strong>
          <span>Open</span>
        </div>
        <div>
          <strong>{formatBytes(quotaStatus.usedBytes)}</strong>
          <span>Storage used</span>
        </div>
      </div>

      <div className="action-row">
        <button type="button" className="secondary-button" onClick={onClearCompleted}>
          <Check size={15} /> Clear completed
        </button>
        <button type="button" className="secondary-button" onClick={onClearAll}>
          <Trash2 size={15} /> Clear all
        </button>
      </div>

      {todos.length === 0 ? (
        <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CloudUpload size={24} />
          <h3>Your runway is clear</h3>
          <p>Add your first todo, or load an existing workspace from local JSON or .todo files.</p>
        </motion.div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={todos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
            <motion.ul className="todo-list" layout>
              <AnimatePresence>
                {todos.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    isEditing={editingId === todo.id}
                    editDraft={editingDraft}
                    onDraftChange={onDraftChange}
                    onBeginEdit={onBeginEdit}
                    onCommitEdit={onCommitEdit}
                    onCancelEdit={onCancelEdit}
                    onToggle={onToggle}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          </SortableContext>
        </DndContext>
      )}

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
