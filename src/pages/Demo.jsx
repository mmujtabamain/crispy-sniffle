import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ToastShelf, WorkspaceHeader, WorkspaceMain, WorkspaceSidebar } from '../components/todo';
import { formatBytes, formatRelativeDate } from '../lib/formatters';
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

      <WorkspaceHeader
        theme={workspace.preferences.theme}
        undoCount={pastRef.current.length}
        redoCount={futureRef.current.length}
        onThemeToggle={handleThemeToggle}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <div className="workspace-grid">
        <WorkspaceSidebar
          title={workspace.meta.title}
          updatedAtLabel={formatRelativeDate(workspace.meta.updatedAt)}
          busyAction={busyAction}
          autosaveMinutes={workspace.preferences.autosaveMinutes}
          backupsCount={backups.length}
          recentFiles={recentFiles}
          formatRelativeDate={formatRelativeDate}
          onOpen={handleOpenWorkspace}
          onSave={handleSaveWorkspace}
          onSaveAs={handleSaveWorkspaceAs}
          onAutosaveChange={handleAutosaveIntervalChange}
          onClearLocalData={handleClearLocalData}
        />

        <WorkspaceMain
          composerInputRef={addInputRef}
          quotaStatus={quotaStatus}
          formatBytes={formatBytes}
          errorMessage={errorMessage}
          newTodoText={newTodoText}
          onNewTodoTextChange={setNewTodoText}
          onComposerEnter={handleAddTodo}
          onAddTodo={handleAddTodo}
          todos={todos}
          completedCount={completedCount}
          pendingCount={pendingCount}
          onClearCompleted={handleClearCompleted}
          onClearAll={handleClearAll}
          sensors={sensors}
          onDragEnd={handleDragEnd}
          editingId={editingId}
          editingDraft={editingDraft}
          onDraftChange={setEditingDraft}
          onBeginEdit={handleBeginEdit}
          onCommitEdit={handleCommitEdit}
          onCancelEdit={handleCancelEdit}
          onToggle={handleToggleTodo}
          onDuplicate={handleDuplicateTodo}
          onDelete={handleDeleteTodo}
        />
      </div>
    </section>
  );
}