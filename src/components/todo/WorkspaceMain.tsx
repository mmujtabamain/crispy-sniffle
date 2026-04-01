import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Archive, Check, CloudUpload, Filter, Sparkles, Trash2, X } from 'lucide-react';
import SortableTodoItem from './SortableTodoItem';
import TodoInspector from './TodoInspector';

export default function WorkspaceMain({
  composerInputRef,
  quotaStatus,
  formatBytes,
  errorMessage,
  activeListName,
  newTodoText,
  onNewTodoTextChange,
  onComposerEnter,
  onAddTodo,
  quickPriority,
  onQuickPriorityChange,
  quickDueDate,
  onQuickDueDateChange,
  quickTags,
  onQuickTagsChange,
  todos,
  allListTodosCount,
  completedCount,
  pendingCount,
  archivedCount,
  selectedTodoIds,
  onToggleSelect,
  onSelectAllFiltered,
  onClearSelection,
  onClearCompleted,
  onArchiveCompleted,
  onClearAll,
  filters,
  onFilterChange,
  onClearFilters,
  availableTags,
  savedFilters,
  onSaveCurrentFilters,
  onApplySavedFilter,
  onDeleteSavedFilter,
  sensors,
  onDragEnd,
  dragDisabled,
  editingId,
  editingDraft,
  onDraftChange,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onToggle,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  onOpenContextMenu,
  focusedTodo,
  timer,
  onPatchTodo,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAttachFiles,
  onStartTimer,
  onStopTimer,
  onResetTimer,
  onBulkSetPriority,
  onBulkDelete,
  onBulkArchive,
  onFocusTodo
}) {
  const isAnyFilterActive =
    filters.completion !== 'active' ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.startDate ||
    filters.endDate ||
    filters.tags.length > 0 ||
    filters.searchText ||
    filters.searchTag ||
    filters.smartFilter !== 'none' ||
    filters.sortBy !== 'manual';

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
        <div className="composer-input-grid">
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

          <select value={quickPriority} onChange={(event) => onQuickPriorityChange(event.target.value)}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
            <option value="critical">Critical priority</option>
          </select>

          <input
            type="date"
            value={quickDueDate}
            onChange={(event) => onQuickDueDateChange(event.target.value)}
            aria-label="Due date"
          />

          <input
            value={quickTags}
            onChange={(event) => onQuickTagsChange(event.target.value)}
            placeholder="tags: launch, inbox"
            aria-label="Quick tags"
          />
        </div>
        <button type="button" className="primary-button" onClick={onAddTodo}>
          <Sparkles size={16} /> Add
        </button>
      </div>

      <div className="filter-panel">
        <div className="panel-headline-row">
          <h3>
            <Filter size={16} /> Filters & Sorting
          </h3>
          <div className="inline-row">
            <button type="button" className="secondary-button" onClick={onSaveCurrentFilters}>
              Save current filter
            </button>
            <button type="button" className="secondary-button" onClick={onClearFilters}>
              <X size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="filter-grid">
          <label>
            Completion
            <select value={filters.completion} onChange={(event) => onFilterChange('completion', event.target.value)}>
              <option value="active">Active only</option>
              <option value="completed">Completed only</option>
              <option value="pending">Pending only</option>
              <option value="archived">Archived only</option>
              <option value="all">All statuses</option>
            </select>
          </label>

          <label>
            Priority
            <select value={filters.priority} onChange={(event) => onFilterChange('priority', event.target.value)}>
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label>
            Status
            <select value={filters.status} onChange={(event) => onFilterChange('status', event.target.value)}>
              <option value="all">All statuses</option>
              <option value="todo">Todo</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>

          <label>
            Smart filter
            <select value={filters.smartFilter} onChange={(event) => onFilterChange('smartFilter', event.target.value)}>
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
              onChange={(event) => onFilterChange('searchText', event.target.value)}
              placeholder="Search todos and notes"
            />
          </label>

          <label>
            Search tag
            <input
              value={filters.searchTag}
              onChange={(event) => onFilterChange('searchTag', event.target.value)}
              placeholder="tag name"
            />
          </label>

          <label>
            Date start
            <input type="date" value={filters.startDate} onChange={(event) => onFilterChange('startDate', event.target.value)} />
          </label>

          <label>
            Date end
            <input type="date" value={filters.endDate} onChange={(event) => onFilterChange('endDate', event.target.value)} />
          </label>

          <label>
            Sort
            <select value={filters.sortBy} onChange={(event) => onFilterChange('sortBy', event.target.value)}>
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
              onChange={(event) => {
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
                className={`chip-button ${isActive ? 'active' : ''}`}
                onClick={() => {
                  const next = isActive ? filters.tags.filter((entry) => entry !== tag) : [...filters.tags, tag];
                  onFilterChange('tags', next);
                }}
              >
                #{tag}
              </button>
            );
          })}
        </div>

        {savedFilters.length > 0 && (
          <div className="saved-filter-row">
            {savedFilters.map((preset) => (
              <button key={preset.id} type="button" className="chip-button" onClick={() => onDeleteSavedFilter(preset.id)}>
                Delete {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="stats-row" aria-label="Todo counters">
        <div>
          <strong>{todos.length}</strong>
          <span>Visible</span>
        </div>
        <div>
          <strong>{allListTodosCount}</strong>
          <span>In {activeListName || 'list'}</span>
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
          <strong>{archivedCount}</strong>
          <span>Archived</span>
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
        <button type="button" className="secondary-button" onClick={onArchiveCompleted}>
          <Archive size={15} /> Archive completed
        </button>
        <button type="button" className="secondary-button" onClick={onClearAll}>
          <Trash2 size={15} /> Clear all
        </button>
      </div>

      {selectedTodoIds.length > 0 && (
        <div className="bulk-bar">
          <strong>{selectedTodoIds.length} selected</strong>
          <button type="button" className="secondary-button" onClick={() => onBulkSetPriority('high')}>
            Set high priority
          </button>
          <button type="button" className="secondary-button" onClick={onBulkArchive}>
            Archive selected
          </button>
          <button type="button" className="danger-button" onClick={onBulkDelete}>
            Delete selected
          </button>
          <button type="button" className="secondary-button" onClick={onSelectAllFiltered}>
            Select visible
          </button>
          <button type="button" className="secondary-button" onClick={onClearSelection}>
            Clear selection
          </button>
        </div>
      )}

      {dragDisabled && !isAnyFilterActive && (
        <p className="meta-line">Manual sorting is disabled because another sort mode is active.</p>
      )}

      {todos.length === 0 ? (
        <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CloudUpload size={24} />
          <h3>Your runway is clear</h3>
          <p>Use the composer, import panel, or saved filters to build your Tier 2 workspace.</p>
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
                    isSelected={selectedTodoIds.includes(todo.id)}
                    onSelect={onToggleSelect}
                    onToggle={onToggle}
                    onDuplicate={onDuplicate}
                    onArchive={onArchive}
                    onRestore={onRestore}
                    onDelete={onDelete}
                    onFocus={onFocusTodo}
                    onOpenContextMenu={onOpenContextMenu}
                    dragDisabled={dragDisabled}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          </SortableContext>
        </DndContext>
      )}

      <TodoInspector
        todo={focusedTodo}
        timer={timer}
        onPatch={onPatchTodo}
        onAddSubtask={onAddSubtask}
        onToggleSubtask={onToggleSubtask}
        onDeleteSubtask={onDeleteSubtask}
        onAttachFiles={onAttachFiles}
        onStartTimer={onStartTimer}
        onStopTimer={onStopTimer}
        onResetTimer={onResetTimer}
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
