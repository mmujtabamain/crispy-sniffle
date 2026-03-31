import { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CloudUpload,
  Copy,
  Eraser,
  FileDown,
  FileUp,
  LoaderCircle,
  Moon,
  Redo2,
  Save,
  Sparkles,
  Sun,
  Trash2,
  Undo2
} from 'lucide-react';
import {
  clearAllLocalData,
  createBackupSnapshot,
  createTodo,
  downloadWorkspaceFile,
  getRecentFiles,
  getStorageQuotaStatus,
  listBackups,
  loadWorkspaceFromStorage,
  makeId,
  openWorkspaceFromFile,
  openWorkspaceViaPicker,
  readSettings,
  registerRecentFile,
  saveWorkspaceAsViaPicker,
  saveWorkspaceToStorage,
  saveWorkspaceWithHandle,
  supportsFileSystemAccessApi,
  validateWorkspace,
  writeSettings
} from '../lib/workspace';

const HISTORY_LIMIT = 120;
const TOAST_LIFETIME_MS = 3200;

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRelativeDate(isoString) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(isoString));
  } catch {
    return 'Unknown';
  }
}

function stampWorkspace(workspace) {
  const timestamp = new Date().toISOString();
  return {
    ...workspace,
    meta: {
      ...workspace.meta,
      updatedAt: timestamp
    }
  };
}

function mergeListTodos(allTodos, listId, listTodos) {
  const outsideList = allTodos.filter((todo) => todo.listId !== listId);
  const normalized = listTodos.map((todo, index) => ({
    ...todo,
    listId,
    order: index,
    updatedAt: todo.updatedAt || new Date().toISOString()
  }));

  return [...outsideList, ...normalized];
}

function ToastShelf({ toasts, onDismiss }) {
  return (
    <div className="toast-shelf" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>{toast.message}</span>
            <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SortableTodoItem({
  todo,
  isEditing,
  editDraft,
  onDraftChange,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onToggle,
  onDuplicate,
  onDelete
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`todo-item ${todo.completed ? 'todo-complete' : ''}`}
    >
      <button
        type="button"
        className="grab-handle"
        aria-label="Reorder todo"
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>

      <label className="todo-check-wrap" title="Toggle complete">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark ${todo.text} as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        <span className="todo-check-mark" aria-hidden="true">
          <Check size={14} />
        </span>
      </label>

      <div className="todo-main" onDoubleClick={() => onBeginEdit(todo)}>
        {isEditing ? (
          <input
            className="todo-edit-input"
            value={editDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onCommitEdit();
              }
              if (event.key === 'Escape') {
                onCancelEdit();
              }
            }}
            autoFocus
            aria-label="Edit todo text"
          />
        ) : (
          <button type="button" className="todo-text-button" onClick={() => onBeginEdit(todo)}>
            <span className="todo-text">{todo.text}</span>
          </button>
        )}
      </div>

      <div className="todo-actions">
        <button type="button" className="ghost-button" onClick={() => onDuplicate(todo.id)} aria-label="Duplicate todo">
          <Copy size={15} />
        </button>
        <button type="button" className="ghost-button danger" onClick={() => onDelete(todo.id)} aria-label="Delete todo">
          <Trash2 size={15} />
        </button>
      </div>
    </motion.li>
  );
}

export default function Demo() {
  const boot = useMemo(() => {
    const loaded = loadWorkspaceFromStorage();
    const settings = readSettings();
    const patchedWorkspace = {
      ...loaded.workspace,
      preferences: {
        ...loaded.workspace.preferences,
        theme: settings.theme || loaded.workspace.preferences.theme,
        autosaveMinutes: settings.autosaveMinutes || loaded.workspace.preferences.autosaveMinutes
      }
    };

    return {
      ...loaded,
      workspace: validateWorkspace(patchedWorkspace).workspace,
      recentFiles: getRecentFiles(),
      backups: listBackups(),
      quotaStatus: getStorageQuotaStatus()
    };
  }, []);

  const [workspace, setWorkspace] = useState(boot.workspace);
  const [recentFiles, setRecentFiles] = useState(boot.recentFiles);
  const [backups, setBackups] = useState(boot.backups);
  const [quotaStatus, setQuotaStatus] = useState(boot.quotaStatus);

  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('workspace.todo.json');
  const [fileHandle, setFileHandle] = useState(null);
  const [toasts, setToasts] = useState([]);

  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const openInputRef = useRef(null);
  const addInputRef = useRef(null);
  const workspaceRef = useRef(workspace);
  const previousQuotaWarningRef = useRef(boot.quotaStatus.warning);

  const activeListId = workspace.lists[0]?.id;
  const todos = useMemo(
    () => workspace.todos.filter((todo) => todo.listId === activeListId).sort((a, b) => a.order - b.order),
    [workspace.todos, activeListId]
  );
  const completedCount = todos.filter((todo) => todo.completed).length;
  const pendingCount = todos.length - completedCount;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function notify(type, message) {
    const id = makeId('toast');
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, TOAST_LIFETIME_MS);
  }

  function dismissToast(toastId) {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }

  function commitWorkspace(nextWorkspaceOrUpdater, { recordHistory = true } = {}) {
    setWorkspace((prevWorkspace) => {
      const nextWorkspace =
        typeof nextWorkspaceOrUpdater === 'function'
          ? nextWorkspaceOrUpdater(prevWorkspace)
          : nextWorkspaceOrUpdater;

      const validated = validateWorkspace(stampWorkspace(nextWorkspace)).workspace;
      if (recordHistory) {
        pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), prevWorkspace];
        futureRef.current = [];
      }
      return validated;
    });
  }

  function replaceActiveListTodos(nextListTodos, options) {
    commitWorkspace(
      (prevWorkspace) => ({
        ...prevWorkspace,
        todos: mergeListTodos(prevWorkspace.todos, activeListId, nextListTodos)
      }),
      options
    );
  }

  function handleAddTodo() {
    const trimmed = newTodoText.trim();
    if (!trimmed) {
      setErrorMessage('Type a task before adding it.');
      notify('error', 'Cannot add an empty todo.');
      return;
    }

    const todo = createTodo(trimmed, activeListId);
    todo.order = todos.length;
    replaceActiveListTodos([...todos, todo]);
    setNewTodoText('');
    setErrorMessage('');
    notify('success', 'Todo added.');
  }

  function handleToggleTodo(todoId) {
    const updatedTodos = todos.map((todo) =>
      todo.id === todoId
        ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
        : todo
    );
    replaceActiveListTodos(updatedTodos);
  }

  function handleDeleteTodo(todoId) {
    const updatedTodos = todos.filter((todo) => todo.id !== todoId);
    replaceActiveListTodos(updatedTodos);
    notify('success', 'Todo removed.');
  }

  function handleDuplicateTodo(todoId) {
    const index = todos.findIndex((todo) => todo.id === todoId);
    if (index < 0) {
      return;
    }

    const original = todos[index];
    const duplicate = {
      ...original,
      id: makeId('todo'),
      text: `${original.text} (copy)`,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTodos = [...todos.slice(0, index + 1), duplicate, ...todos.slice(index + 1)];
    replaceActiveListTodos(updatedTodos);
    notify('success', 'Todo duplicated.');
  }

  function handleBeginEdit(todo) {
    setEditingId(todo.id);
    setEditingDraft(todo.text);
  }

  function handleCommitEdit() {
    if (!editingId) {
      return;
    }

    const trimmed = editingDraft.trim();
    if (!trimmed) {
      setErrorMessage('Todo text cannot be empty.');
      notify('error', 'Edit cancelled because text was empty.');
      setEditingId(null);
      setEditingDraft('');
      return;
    }

    const updatedTodos = todos.map((todo) =>
      todo.id === editingId ? { ...todo, text: trimmed, updatedAt: new Date().toISOString() } : todo
    );
    replaceActiveListTodos(updatedTodos);
    setEditingId(null);
    setEditingDraft('');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingDraft('');
  }

  function handleUndo() {
    if (pastRef.current.length === 0) {
      notify('warning', 'Nothing to undo.');
      return;
    }

    setWorkspace((currentWorkspace) => {
      const previous = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [currentWorkspace, ...futureRef.current.slice(0, HISTORY_LIMIT - 1)];
      return previous;
    });
    setEditingId(null);
  }

  function handleRedo() {
    if (futureRef.current.length === 0) {
      notify('warning', 'Nothing to redo.');
      return;
    }

    setWorkspace((currentWorkspace) => {
      const next = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), currentWorkspace];
      return next;
    });
    setEditingId(null);
  }

  function handleClearCompleted() {
    const updatedTodos = todos.filter((todo) => !todo.completed);
    if (updatedTodos.length === todos.length) {
      notify('warning', 'There are no completed todos to clear.');
      return;
    }
    replaceActiveListTodos(updatedTodos);
    notify('success', 'Completed todos cleared.');
  }

  function handleClearAll() {
    if (!todos.length) {
      return;
    }
    const confirmed = window.confirm('Clear every todo in this workspace?');
    if (!confirmed) {
      return;
    }
    replaceActiveListTodos([]);
    notify('success', 'All todos cleared.');
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = todos.findIndex((todo) => todo.id === active.id);
    const newIndex = todos.findIndex((todo) => todo.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    replaceActiveListTodos(arrayMove(todos, oldIndex, newIndex));
  }

  async function handleOpenWorkspace() {
    setBusyAction('open');
    setErrorMessage('');

    try {
      if (supportsFileSystemAccessApi()) {
        const result = await openWorkspaceViaPicker();
        const normalized = validateWorkspace(result.workspace).workspace;
        commitWorkspace(
          {
            ...normalized,
            meta: {
              ...normalized.meta,
              title: result.fileName || normalized.meta.title,
              lastOpenedAt: new Date().toISOString()
            }
          },
          { recordHistory: true }
        );

        setFileHandle(result.fileHandle);
        setFileName(result.fileName || fileName);
        setRecentFiles(getRecentFiles());

        if (result.warnings.length > 0) {
          notify('warning', `Loaded with repairs: ${result.warnings.join(' ')}`);
        } else {
          notify('success', 'Workspace file loaded.');
        }
        return;
      }

      openInputRef.current?.click();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Open failed.';
      setErrorMessage(message);
      notify('error', message);
    } finally {
      setBusyAction('');
    }
  }

  async function handleOpenFromInput(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBusyAction('open');
    setErrorMessage('');

    try {
      const result = await openWorkspaceFromFile(file);
      const normalized = validateWorkspace(result.workspace).workspace;
      commitWorkspace(
        {
          ...normalized,
          meta: {
            ...normalized.meta,
            title: file.name,
            lastOpenedAt: new Date().toISOString()
          }
        },
        { recordHistory: true }
      );

      setFileName(file.name);
      setFileHandle(null);
      setRecentFiles(getRecentFiles());

      if (result.warnings.length > 0) {
        notify('warning', `Loaded with repairs: ${result.warnings.join(' ')}`);
      } else {
        notify('success', 'Workspace imported from local file.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not import file.';
      setErrorMessage(message);
      notify('error', message);
    } finally {
      setBusyAction('');
      event.target.value = '';
    }
  }

  async function handleSaveWorkspace() {
    setBusyAction('save');
    setErrorMessage('');

    try {
      if (fileHandle) {
        await saveWorkspaceWithHandle(workspace, fileHandle);
        registerRecentFile({ name: fileName, source: 'save' });
      } else if (supportsFileSystemAccessApi()) {
        const saveResult = await saveWorkspaceAsViaPicker(workspace, fileName);
        setFileHandle(saveResult.fileHandle);
        setFileName(saveResult.fileName || fileName);
      } else {
        const fallbackName = fileName || 'workspace.todo.json';
        downloadWorkspaceFile(workspace, fallbackName);
      }

      setRecentFiles(getRecentFiles());
      notify('success', 'Workspace saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed.';
      setErrorMessage(message);
      notify('error', message);
    } finally {
      setBusyAction('');
    }
  }

  async function handleSaveWorkspaceAs() {
    setBusyAction('saveAs');
    setErrorMessage('');

    try {
      if (supportsFileSystemAccessApi()) {
        const suggestedName = fileName || 'workspace.todo.json';
        const saveResult = await saveWorkspaceAsViaPicker(workspace, suggestedName);
        setFileHandle(saveResult.fileHandle);
        setFileName(saveResult.fileName || suggestedName);
      } else {
        const requestedName = window.prompt('Save as filename', fileName || 'workspace.todo.json');
        if (!requestedName) {
          setBusyAction('');
          return;
        }
        const normalizedName = requestedName.endsWith('.json') || requestedName.endsWith('.todo')
          ? requestedName
          : `${requestedName}.todo.json`;
        downloadWorkspaceFile(workspace, normalizedName);
        setFileName(normalizedName);
      }

      setRecentFiles(getRecentFiles());
      notify('success', 'Workspace saved with a new filename.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save As failed.';
      setErrorMessage(message);
      notify('error', message);
    } finally {
      setBusyAction('');
    }
  }

  function handleClearLocalData() {
    const confirmed = window.confirm('Clear all local workspace data, backups, and recent files?');
    if (!confirmed) {
      return;
    }

    clearAllLocalData();
    pastRef.current = [];
    futureRef.current = [];
    setWorkspace(loadWorkspaceFromStorage().workspace);
    setRecentFiles([]);
    setBackups([]);
    setFileName('workspace.todo.json');
    setFileHandle(null);
    setQuotaStatus(getStorageQuotaStatus());
    notify('success', 'Local data was cleared.');
  }

  function handleThemeToggle() {
    const nextTheme = workspace.preferences.theme === 'dark' ? 'light' : 'dark';
    commitWorkspace(
      (prevWorkspace) => ({
        ...prevWorkspace,
        preferences: {
          ...prevWorkspace.preferences,
          theme: nextTheme
        }
      }),
      { recordHistory: false }
    );
  }

  function handleAutosaveIntervalChange(nextMinutes) {
    commitWorkspace(
      (prevWorkspace) => ({
        ...prevWorkspace,
        preferences: {
          ...prevWorkspace.preferences,
          autosaveMinutes: nextMinutes
        }
      }),
      { recordHistory: false }
    );
    notify('success', `Backup interval set to ${nextMinutes} minute${nextMinutes === 1 ? '' : 's'}.`);
  }

  useEffect(() => {
    workspaceRef.current = workspace;
    saveWorkspaceToStorage(workspace);

    const nextQuotaStatus = getStorageQuotaStatus();
    setQuotaStatus(nextQuotaStatus);

    writeSettings({
      theme: workspace.preferences.theme,
      autosaveMinutes: workspace.preferences.autosaveMinutes
    });

    if (nextQuotaStatus.warning && !previousQuotaWarningRef.current) {
      notify('warning', 'Local storage is almost full. Consider clearing data or exporting backups.');
    }
    previousQuotaWarningRef.current = nextQuotaStatus.warning;
  }, [workspace]);

  useEffect(() => {
    document.body.dataset.theme = workspace.preferences.theme;
  }, [workspace.preferences.theme]);

  useEffect(() => {
    if (boot.errors.length > 0) {
      notify('warning', `Workspace was repaired on load: ${boot.errors.join(' ')}`);
    }
  }, [boot.errors]);

  useEffect(() => {
    const backupIntervalMs = Number(workspace.preferences.autosaveMinutes) * 60 * 1000;
    if (!Number.isFinite(backupIntervalMs) || backupIntervalMs < 60 * 1000) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      createBackupSnapshot(workspaceRef.current);
      setBackups(listBackups());
    }, backupIntervalMs);

    return () => window.clearInterval(timerId);
  }, [workspace.preferences.autosaveMinutes]);

  useEffect(() => {
    function onKeyDown(event) {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        if (event.shiftKey) {
          void handleSaveWorkspaceAs();
        } else {
          void handleSaveWorkspace();
        }
      }

      if (key === 'o') {
        event.preventDefault();
        void handleOpenWorkspace();
      }

      if (key === 'n') {
        event.preventDefault();
        addInputRef.current?.focus();
      }

      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if (key === 'y') {
        event.preventDefault();
        handleRedo();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <section className="workspace-shell">
      <input
        ref={openInputRef}
        type="file"
        accept=".json,.todo,application/json"
        hidden
        onChange={(event) => {
          void handleOpenFromInput(event);
        }}
      />

      <ToastShelf toasts={toasts} onDismiss={dismissToast} />

      <header className="workspace-header">
        <div className="headline-wrap">
          <p className="kicker">Tier 1 Delivery</p>
          <h1 className="headline">Local-First Todo Atelier</h1>
          <p className="subhead">
            Fast single-workspace todos with versioned storage, drag-drop ordering, file export/import, and undo-safe editing.
          </p>
        </div>

        <div className="header-controls">
          <button type="button" className="icon-button" onClick={handleThemeToggle} aria-label="Toggle theme">
            {workspace.preferences.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button type="button" className="icon-button" onClick={handleUndo} aria-label="Undo">
            <Undo2 size={18} />
            <span>{pastRef.current.length}</span>
          </button>
          <button type="button" className="icon-button" onClick={handleRedo} aria-label="Redo">
            <Redo2 size={18} />
            <span>{futureRef.current.length}</span>
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="workspace-aside">
          <div className="panel">
            <h2>Workspace</h2>
            <p className="panel-copy">{workspace.meta.title}</p>
            <p className="meta-line">Updated {formatRelativeDate(workspace.meta.updatedAt)}</p>
          </div>

          <div className="panel">
            <h2>Persistence</h2>
            <div className="button-stack">
              <button type="button" className="secondary-button" onClick={() => void handleOpenWorkspace()}>
                {busyAction === 'open' ? <LoaderCircle size={16} className="spin" /> : <FileUp size={16} />} Open
              </button>
              <button type="button" className="secondary-button" onClick={() => void handleSaveWorkspace()}>
                {busyAction === 'save' ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />} Save
              </button>
              <button type="button" className="secondary-button" onClick={() => void handleSaveWorkspaceAs()}>
                {busyAction === 'saveAs' ? <LoaderCircle size={16} className="spin" /> : <FileDown size={16} />} Save As
              </button>
            </div>
          </div>

          <div className="panel">
            <h2>Auto-Backup</h2>
            <label htmlFor="autosave-select" className="setting-label">
              Snapshot interval
            </label>
            <select
              id="autosave-select"
              value={workspace.preferences.autosaveMinutes}
              onChange={(event) => handleAutosaveIntervalChange(Number(event.target.value))}
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
            </select>
            <p className="meta-line">{backups.length} local snapshots retained</p>
          </div>

          <div className="panel">
            <h2>Recent Files</h2>
            {recentFiles.length === 0 ? (
              <p className="meta-line">No recent files yet.</p>
            ) : (
              <ul className="recent-list">
                {recentFiles.slice(0, 5).map((entry) => (
                  <li key={entry.id}>
                    <span>{entry.name}</span>
                    <small>{formatRelativeDate(entry.timestamp)}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel danger-panel">
            <h2>Danger Zone</h2>
            <button type="button" className="danger-button" onClick={handleClearLocalData}>
              <Eraser size={16} /> Clear local data
            </button>
          </div>
        </aside>

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
              ref={addInputRef}
              value={newTodoText}
              onChange={(event) => setNewTodoText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleAddTodo();
                }
              }}
              placeholder="Add a focused task, then press Enter"
            />
            <button type="button" className="primary-button" onClick={handleAddTodo}>
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
            <button type="button" className="secondary-button" onClick={handleClearCompleted}>
              <Check size={15} /> Clear completed
            </button>
            <button type="button" className="secondary-button" onClick={handleClearAll}>
              <Trash2 size={15} /> Clear all
            </button>
          </div>

          {todos.length === 0 ? (
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CloudUpload size={24} />
              <h3>Your runway is clear</h3>
              <p>
                Add your first todo, or load an existing workspace from local JSON or .todo files.
              </p>
            </motion.div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={todos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
                <motion.ul className="todo-list" layout>
                  <AnimatePresence>
                    {todos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        isEditing={editingId === todo.id}
                        editDraft={editingDraft}
                        onDraftChange={setEditingDraft}
                        onBeginEdit={handleBeginEdit}
                        onCommitEdit={handleCommitEdit}
                        onCancelEdit={handleCancelEdit}
                        onToggle={handleToggleTodo}
                        onDuplicate={handleDuplicateTodo}
                        onDelete={handleDeleteTodo}
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
      </div>
    </section>
  );
}