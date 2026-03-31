import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  GraphWorkspace,
  ToastShelf,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceSidebar
} from '../components/todo';
import { formatBytes, formatRelativeDate } from '../lib/formatters';
import { applyFiltersAndSort, collectTags, createDefaultFilters } from '../lib/tier2-filters';
import {
  importTodosFromCsv,
  parseImportFile,
  todosToCsv,
  todosToJson,
  todosToMarkdown,
  todosToText
} from '../lib/tier2-formats';
import { exportTodosToImages, exportTodosToPdf, printTodos } from '../lib/tier2-export';
import {
  clearAllLocalData,
  createBackupSnapshot,
  createList,
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

const HISTORY_LIMIT = 150;
const TOAST_LIFETIME_MS = 3400;
const DEFAULT_FILE_NAME = 'workspace.todo.json';
const DEFAULT_TIMER_SECONDS = 25 * 60;

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

function parseTagInput(raw) {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function downloadTextFile(content, fileName, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function fileToAttachment(file) {
  const isImage = file.type.startsWith('image/');
  let previewUrl = null;

  if (isImage && file.size <= 320 * 1024) {
    previewUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => reject(new Error(`Could not read image preview for ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  return {
    id: makeId('attachment'),
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size || 0,
    previewUrl
  };
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
        autosaveMinutes: settings.autosaveMinutes || loaded.workspace.preferences.autosaveMinutes,
        activeListId:
          settings.activeListId ||
          loaded.workspace.preferences.activeListId ||
          loaded.workspace.lists[0]?.id
      }
    };

    const validated = validateWorkspace(patchedWorkspace).workspace;

    return {
      ...loaded,
      workspace: validated,
      savedFilters: Array.isArray(settings.savedFilters) ? settings.savedFilters : [],
      recentFiles: getRecentFiles(),
      backups: listBackups(),
      quotaStatus: getStorageQuotaStatus()
    };
  }, []);

  const [workspace, setWorkspace] = useState(boot.workspace);
  const [activeListId, setActiveListId] = useState(
    boot.workspace.preferences.activeListId || boot.workspace.lists[0]?.id
  );
  const [recentFiles, setRecentFiles] = useState(boot.recentFiles);
  const [backups, setBackups] = useState(boot.backups);
  const [quotaStatus, setQuotaStatus] = useState(boot.quotaStatus);

  const [newTodoText, setNewTodoText] = useState('');
  const [quickPriority, setQuickPriority] = useState('medium');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickTags, setQuickTags] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [selectedTodoIds, setSelectedTodoIds] = useState([]);
  const [focusedTodoId, setFocusedTodoId] = useState(null);

  const [filters, setFilters] = useState(createDefaultFilters());
  const [savedFilters, setSavedFilters] = useState(boot.savedFilters);

  const [showArchivedLists, setShowArchivedLists] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [importMode, setImportMode] = useState('merge');
  const [importPreviews, setImportPreviews] = useState([]);

  const [busyAction, setBusyAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState(DEFAULT_FILE_NAME);
  const [fileHandle, setFileHandle] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  const [exportConfig, setExportConfig] = useState({
    scope: 'list',
    fileName: 'tier2-export',
    pdfHeader: '',
    pdfFooter: '',
    imageMode: 'single',
    imageFormat: 'png',
    imageWidth: 1400,
    imageHeight: 1800,
    imageFontSize: 28,
    todosPerImage: 12,
    imageBackground: '#f6efe9'
  });

  const [timer, setTimer] = useState({
    todoId: null,
    running: false,
    remainingSec: DEFAULT_TIMER_SECONDS
  });

  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const openInputRef = useRef(null);
  const importInputRef = useRef(null);
  const addInputRef = useRef(null);
  const workspaceRef = useRef(workspace);
  const previousQuotaWarningRef = useRef(boot.quotaStatus.warning);

  const lists = useMemo(() => [...workspace.lists].sort((a, b) => a.order - b.order), [workspace.lists]);
  const activeList = lists.find((list) => list.id === activeListId) || lists[0];

  const listTodos = useMemo(
    () =>
      workspace.todos
        .filter((todo) => todo.listId === activeList?.id)
        .sort((a, b) => a.order - b.order),
    [workspace.todos, activeList?.id]
  );

  const filteredTodos = useMemo(() => applyFiltersAndSort(listTodos, filters), [listTodos, filters]);
  const availableTags = useMemo(() => collectTags(listTodos), [listTodos]);

  const completedCount = filteredTodos.filter((todo) => todo.completed).length;
  const pendingCount = filteredTodos.filter((todo) => !todo.completed && !todo.archived).length;
  const archivedCount = listTodos.filter((todo) => todo.archived).length;

  const focusedTodo = workspace.todos.find((todo) => todo.id === focusedTodoId) || null;

  const dragDisabled =
    filters.sortBy !== 'manual' ||
    filters.completion !== 'active' ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.startDate ||
    filters.endDate ||
    filters.tags.length > 0 ||
    filters.searchText ||
    filters.searchTag ||
    filters.smartFilter !== 'none';

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
    if (!activeList?.id) {
      return;
    }

    commitWorkspace(
      (prevWorkspace) => ({
        ...prevWorkspace,
        todos: mergeListTodos(prevWorkspace.todos, activeList.id, nextListTodos)
      }),
      options
    );
  }

  function handleAddTodo() {
    if (!activeList?.id) {
      return;
    }

    const trimmed = newTodoText.trim();
    if (!trimmed) {
      setErrorMessage('Type a task before adding it.');
      notify('error', 'Cannot add an empty todo.');
      return;
    }

    const todo = createTodo(trimmed, activeList.id, {
      order: listTodos.length,
      priority: quickPriority,
      dueDate: quickDueDate || null,
      tags: parseTagInput(quickTags)
    });

    replaceActiveListTodos([...listTodos, todo]);
    setNewTodoText('');
    setQuickTags('');
    setErrorMessage('');
    notify('success', 'Todo added.');
  }

  function handleToggleTodo(todoId) {
    const updatedTodos = listTodos.map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            completed: !todo.completed,
            status: !todo.completed ? 'done' : 'todo',
            updatedAt: new Date().toISOString()
          }
        : todo
    );
    replaceActiveListTodos(updatedTodos);
  }

  function handleDeleteTodo(todoId) {
    const updatedTodos = listTodos.filter((todo) => todo.id !== todoId);
    replaceActiveListTodos(updatedTodos);
    setSelectedTodoIds((prev) => prev.filter((id) => id !== todoId));
    if (focusedTodoId === todoId) {
      setFocusedTodoId(null);
    }
    notify('success', 'Todo removed.');
  }

  function handleDuplicateTodo(todoId) {
    const index = listTodos.findIndex((todo) => todo.id === todoId);
    if (index < 0) {
      return;
    }

    const original = listTodos[index];
    const duplicate = {
      ...original,
      id: makeId('todo'),
      text: `${original.text} (copy)`,
      completed: false,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTodos = [...listTodos.slice(0, index + 1), duplicate, ...listTodos.slice(index + 1)];
    replaceActiveListTodos(updatedTodos);
    notify('success', 'Todo duplicated.');
  }

  function handleArchiveTodo(todoId) {
    const updatedTodos = listTodos.map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            archived: true,
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : todo
    );
    replaceActiveListTodos(updatedTodos);
  }

  function handleRestoreTodo(todoId) {
    const updatedTodos = listTodos.map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            archived: false,
            archivedAt: null,
            updatedAt: new Date().toISOString()
          }
        : todo
    );
    replaceActiveListTodos(updatedTodos);
  }

  function handleBeginEdit(todo) {
    setEditingId(todo.id);
    setEditingDraft(todo.text);
    setFocusedTodoId(todo.id);
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

    const updatedTodos = listTodos.map((todo) =>
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

  function handlePatchTodo(todoId, patch) {
    const updatedTodos = listTodos.map((todo) => {
      if (todo.id !== todoId) {
        return todo;
      }

      const nextText = typeof patch.text === 'string' ? patch.text.trim() : todo.text;
      return {
        ...todo,
        ...patch,
        text: nextText || todo.text,
        updatedAt: new Date().toISOString()
      };
    });

    replaceActiveListTodos(updatedTodos);
  }

  function handleAddSubtask(todoId, text) {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const updatedTodos = listTodos.map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            subtasks: [...(todo.subtasks || []), { id: makeId('subtask'), text: trimmed, completed: false }],
            updatedAt: new Date().toISOString()
          }
        : todo
    );

    replaceActiveListTodos(updatedTodos);
  }

  function handleToggleSubtask(todoId, subtaskId) {
    const updatedTodos = listTodos.map((todo) => {
      if (todo.id !== todoId) {
        return todo;
      }

      return {
        ...todo,
        subtasks: (todo.subtasks || []).map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        ),
        updatedAt: new Date().toISOString()
      };
    });

    replaceActiveListTodos(updatedTodos);
  }

  function handleDeleteSubtask(todoId, subtaskId) {
    const updatedTodos = listTodos.map((todo) => {
      if (todo.id !== todoId) {
        return todo;
      }

      return {
        ...todo,
        subtasks: (todo.subtasks || []).filter((subtask) => subtask.id !== subtaskId),
        updatedAt: new Date().toISOString()
      };
    });

    replaceActiveListTodos(updatedTodos);
  }

  async function handleAttachFiles(todoId, files) {
    try {
      const attachments = await Promise.all(files.map((file) => fileToAttachment(file)));
      const updatedTodos = listTodos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              attachments: [...(todo.attachments || []), ...attachments],
              updatedAt: new Date().toISOString()
            }
          : todo
      );
      replaceActiveListTodos(updatedTodos);
      notify('success', `${attachments.length} file(s) attached.`);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not attach files.');
    }
  }

  function applyTrackedMinutes(todoId, minutes) {
    if (!todoId || !Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    const updatedTodos = listTodos.map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            actualMinutes: Math.max(0, Number(todo.actualMinutes || 0) + minutes),
            updatedAt: new Date().toISOString()
          }
        : todo
    );

    replaceActiveListTodos(updatedTodos, { recordHistory: false });
  }

  function handleStartTimer(todoId) {
    setTimer({
      todoId,
      running: true,
      remainingSec: DEFAULT_TIMER_SECONDS
    });
  }

  function handleStopTimer() {
    setTimer((prev) => {
      if (!prev.running) {
        return prev;
      }
      const spentSec = DEFAULT_TIMER_SECONDS - prev.remainingSec;
      const trackedMinutes = Math.max(1, Math.round(spentSec / 60));
      applyTrackedMinutes(prev.todoId, trackedMinutes);
      notify('success', `${trackedMinutes} minute(s) tracked.`);
      return {
        ...prev,
        running: false
      };
    });
  }

  function handleResetTimer() {
    setTimer({
      todoId: null,
      running: false,
      remainingSec: DEFAULT_TIMER_SECONDS
    });
  }

  function handleToggleSelect(todoId) {
    setSelectedTodoIds((prev) => (prev.includes(todoId) ? prev.filter((id) => id !== todoId) : [...prev, todoId]));
  }

  function handleSelectAllFiltered() {
    setSelectedTodoIds(filteredTodos.map((todo) => todo.id));
  }

  function handleClearSelection() {
    setSelectedTodoIds([]);
  }

  function handleBulkSetPriority(priority) {
    const ids = new Set(selectedTodoIds);
    const updatedTodos = listTodos.map((todo) =>
      ids.has(todo.id)
        ? {
            ...todo,
            priority,
            updatedAt: new Date().toISOString()
          }
        : todo
    );
    replaceActiveListTodos(updatedTodos);
    notify('success', `Priority updated for ${selectedTodoIds.length} todos.`);
  }

  function handleBulkArchive() {
    const ids = new Set(selectedTodoIds);
    const updatedTodos = listTodos.map((todo) =>
      ids.has(todo.id)
        ? {
            ...todo,
            archived: true,
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : todo
    );
    replaceActiveListTodos(updatedTodos);
    notify('success', `${selectedTodoIds.length} todos archived.`);
  }

  function handleBulkDelete() {
    const ids = new Set(selectedTodoIds);
    const updatedTodos = listTodos.filter((todo) => !ids.has(todo.id));
    replaceActiveListTodos(updatedTodos);
    setSelectedTodoIds([]);
    notify('success', 'Selected todos deleted.');
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
    const updatedTodos = listTodos.filter((todo) => !todo.completed);
    if (updatedTodos.length === listTodos.length) {
      notify('warning', 'There are no completed todos to clear.');
      return;
    }
    replaceActiveListTodos(updatedTodos);
    notify('success', 'Completed todos cleared.');
  }

  function handleArchiveCompleted() {
    const changed = listTodos.filter((todo) => todo.completed && !todo.archived).length;
    if (changed === 0) {
      notify('warning', 'There are no completed unarchived todos.');
      return;
    }

    const updatedTodos = listTodos.map((todo) =>
      todo.completed
        ? {
            ...todo,
            archived: true,
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : todo
    );
    replaceActiveListTodos(updatedTodos);
    notify('success', `${changed} completed todos archived.`);
  }

  function handleClearAll() {
    if (!listTodos.length) {
      return;
    }
    const confirmed = window.confirm('Clear every todo in this list?');
    if (!confirmed) {
      return;
    }
    replaceActiveListTodos([]);
    setSelectedTodoIds([]);
    notify('success', 'All list todos cleared.');
  }

  function handleDragEnd(event) {
    if (dragDisabled) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = listTodos.findIndex((todo) => todo.id === active.id);
    const newIndex = listTodos.findIndex((todo) => todo.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    replaceActiveListTodos(arrayMove(listTodos, oldIndex, newIndex));
  }

  function handleCreateList(payload) {
    const name = payload.name.trim();
    if (!name) {
      return;
    }

    const list = createList(name);
    list.icon = payload.icon || '🗂️';
    list.color = payload.color || '#b08968';
    list.order = lists.length;

    commitWorkspace((prevWorkspace) => ({
      ...prevWorkspace,
      lists: [...prevWorkspace.lists, list]
    }));
    setActiveListId(list.id);
    notify('success', `List "${name}" created.`);
  }

  function handleRenameList(listId) {
    const list = lists.find((entry) => entry.id === listId);
    if (!list) {
      return;
    }

    const name = window.prompt('Rename list', list.name);
    if (!name) {
      return;
    }

    const icon = window.prompt('List icon or emoji', list.icon || '📋') || list.icon;
    const color = window.prompt('List color (hex)', list.color || '#b08968') || list.color;

    commitWorkspace((prevWorkspace) => ({
      ...prevWorkspace,
      lists: prevWorkspace.lists.map((entry) =>
        entry.id === listId
          ? {
              ...entry,
              name,
              icon,
              color,
              updatedAt: new Date().toISOString()
            }
          : entry
      )
    }));
  }

  function handleDeleteList(listId) {
    if (lists.length <= 1) {
      notify('warning', 'At least one list must remain.');
      return;
    }

    const list = lists.find((entry) => entry.id === listId);
    const confirmed = window.confirm(`Delete list "${list?.name || 'Untitled'}" and move its todos to another list?`);
    if (!confirmed) {
      return;
    }

    const fallback = lists.find((entry) => entry.id !== listId);
    if (!fallback) {
      return;
    }

    commitWorkspace((prevWorkspace) => ({
      ...prevWorkspace,
      lists: prevWorkspace.lists
        .filter((entry) => entry.id !== listId)
        .map((entry, index) => ({
          ...entry,
          order: index
        })),
      todos: prevWorkspace.todos.map((todo) =>
        todo.listId === listId ? { ...todo, listId: fallback.id, updatedAt: new Date().toISOString() } : todo
      )
    }));

    if (activeListId === listId) {
      setActiveListId(fallback.id);
    }

    notify('success', 'List deleted.');
  }

  function handleMoveList(listId, direction) {
    const ordered = [...lists];
    const fromIndex = ordered.findIndex((entry) => entry.id === listId);
    const toIndex = fromIndex + direction;

    if (fromIndex < 0 || toIndex < 0 || toIndex >= ordered.length) {
      return;
    }

    const reordered = arrayMove(ordered, fromIndex, toIndex).map((entry, index) => ({
      ...entry,
      order: index,
      updatedAt: new Date().toISOString()
    }));

    commitWorkspace((prevWorkspace) => ({
      ...prevWorkspace,
      lists: prevWorkspace.lists.map((entry) => reordered.find((candidate) => candidate.id === entry.id) || entry)
    }));
  }

  function handleArchiveList(listId) {
    commitWorkspace((prevWorkspace) => ({
      ...prevWorkspace,
      lists: prevWorkspace.lists.map((entry) =>
        entry.id === listId
          ? {
              ...entry,
              archived: true,
              archivedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : entry
      )
    }));

    if (activeListId === listId) {
      const nextActive = lists.find((entry) => entry.id !== listId && !entry.archived) || lists.find((entry) => entry.id !== listId);
      if (nextActive) {
        setActiveListId(nextActive.id);
      }
    }
  }

  function handleRestoreList(listId) {
    commitWorkspace((prevWorkspace) => ({
      ...prevWorkspace,
      lists: prevWorkspace.lists.map((entry) =>
        entry.id === listId
          ? {
              ...entry,
              archived: false,
              archivedAt: null,
              updatedAt: new Date().toISOString()
            }
          : entry
      )
    }));
  }

  function handleFilterChange(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function handleClearFilters() {
    setFilters(createDefaultFilters());
    notify('success', 'Filters reset.');
  }

  function handleSaveCurrentFilters() {
    const name = window.prompt('Save current filter preset as', `Preset ${savedFilters.length + 1}`);
    if (!name) {
      return;
    }

    const nextPreset = {
      id: makeId('preset'),
      name,
      filters
    };

    setSavedFilters((prev) => [...prev, nextPreset]);
    notify('success', `Saved preset "${name}".`);
  }

  function handleApplySavedFilter(presetId) {
    const preset = savedFilters.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }
    setFilters({ ...createDefaultFilters(), ...preset.filters });
    notify('success', `Applied preset "${preset.name}".`);
  }

  function handleDeleteSavedFilter(presetId) {
    const preset = savedFilters.find((entry) => entry.id === presetId);
    setSavedFilters((prev) => prev.filter((entry) => entry.id !== presetId));
    if (preset) {
      notify('success', `Deleted preset "${preset.name}".`);
    }
  }

  function getScopedTodos(scope) {
    if (scope === 'selected') {
      const selected = new Set(selectedTodoIds);
      return workspace.todos.filter((todo) => selected.has(todo.id));
    }

    if (scope === 'all') {
      return [...workspace.todos].sort((a, b) => a.order - b.order);
    }

    return [...listTodos].sort((a, b) => a.order - b.order);
  }

  function handleExportJson() {
    const todos = getScopedTodos(exportConfig.scope);
    const output = todosToJson(todos);
    const exportName = `${exportConfig.fileName || 'tier2-export'}.json`;
    downloadTextFile(output, exportName, 'application/json;charset=utf-8');
    registerRecentFile({ name: exportName, source: 'export-json' });
    notify('success', `Exported ${todos.length} todos as JSON.`);
  }

  function handleExportCsv() {
    const todos = getScopedTodos(exportConfig.scope);
    const output = todosToCsv(todos);
    const exportName = `${exportConfig.fileName || 'tier2-export'}.csv`;
    downloadTextFile(output, exportName, 'text/csv;charset=utf-8');
    registerRecentFile({ name: exportName, source: 'export-csv' });
    notify('success', `Exported ${todos.length} todos as CSV.`);
  }

  function handleExportMarkdown() {
    const todos = getScopedTodos(exportConfig.scope);
    const output = todosToMarkdown(todos, `${activeList?.name || 'Todos'} export`);
    const exportName = `${exportConfig.fileName || 'tier2-export'}.md`;
    downloadTextFile(output, exportName, 'text/markdown;charset=utf-8');
    registerRecentFile({ name: exportName, source: 'export-md' });
    notify('success', `Exported ${todos.length} todos as Markdown.`);
  }

  function handleExportTxt() {
    const todos = getScopedTodos(exportConfig.scope);
    const output = todosToText(todos, `${activeList?.name || 'Todos'} export`);
    const exportName = `${exportConfig.fileName || 'tier2-export'}.txt`;
    downloadTextFile(output, exportName, 'text/plain;charset=utf-8');
    registerRecentFile({ name: exportName, source: 'export-txt' });
    notify('success', `Exported ${todos.length} todos as TXT.`);
  }

  function handleExportPdf() {
    const todos = getScopedTodos(exportConfig.scope);
    if (todos.length === 0) {
      notify('warning', 'No todos available for PDF export.');
      return;
    }

    exportTodosToPdf(todos, {
      fileName: `${exportConfig.fileName || 'tier2-export'}.pdf`,
      title: activeList?.name || 'Todo export',
      headerText: exportConfig.pdfHeader,
      footerText: exportConfig.pdfFooter,
      includeCheckbox: true,
      includeCompletion: true,
      includeDue: true,
      includePriority: true,
      includeTags: true
    });

    notify('success', `Exported ${todos.length} todos to PDF.`);
  }

  function handlePrint() {
    const todos = getScopedTodos(exportConfig.scope);
    if (todos.length === 0) {
      notify('warning', 'No todos available for print.');
      return;
    }

    try {
      printTodos(todos, {
        title: activeList?.name || 'Todo print view',
        includeCheckbox: true,
        includeCompletion: true,
        includeDue: true,
        includePriority: true,
        includeTags: true
      });
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Print failed.');
    }
  }

  function handleExportImages() {
    const todos = getScopedTodos(exportConfig.scope);
    if (todos.length === 0) {
      notify('warning', 'No todos available for image export.');
      return;
    }

    const formats =
      exportConfig.imageFormat === 'both' ? ['png', 'jpg'] : [exportConfig.imageFormat];

    exportTodosToImages(todos, {
      fileNameBase: exportConfig.fileName || 'tier2-export',
      title: activeList?.name || 'Todo export',
      mode: exportConfig.imageMode,
      width: exportConfig.imageWidth,
      height: exportConfig.imageHeight,
      fontSize: exportConfig.imageFontSize,
      todosPerImage: exportConfig.todosPerImage,
      backgroundColor: exportConfig.imageBackground,
      formats
    });

    notify('success', `Exported ${todos.length} todos as image assets.`);
  }

  async function handleImportFiles(files) {
    if (!activeList?.id || files.length === 0) {
      return;
    }

    try {
      setBusyAction('import');
      setErrorMessage('');
      const parsed = await Promise.all(files.map((file) => parseImportFile(file, activeList.id)));
      setImportPreviews(parsed.map((entry) => ({ ...entry, id: makeId('import') })));
      notify('success', `${parsed.length} file(s) prepared for import preview.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import parse failed.';
      setErrorMessage(message);
      notify('error', message);
    } finally {
      setBusyAction('');
    }
  }

  function handleApplyImports() {
    if (importPreviews.length === 0 || !activeList?.id) {
      return;
    }

    const scopeListId = activeList.id;

    commitWorkspace((prevWorkspace) => {
      let nextWorkspace = { ...prevWorkspace };
      let nextTodos = [...prevWorkspace.todos];

      importPreviews.forEach((preview) => {
        if (preview.kind === 'workspace') {
          const validWorkspace = validateWorkspace(preview.payload).workspace;

          if (importMode === 'replace') {
            nextWorkspace = validWorkspace;
            nextTodos = [...validWorkspace.todos];
            return;
          }

          const importedTodos = (validWorkspace.todos || []).map((todo) => ({
            ...todo,
            id: makeId('todo'),
            listId: scopeListId,
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));

          nextTodos = [...nextTodos, ...importedTodos];

          const mergedNodes = [...(nextWorkspace.graph?.nodes || []), ...(validWorkspace.graph?.nodes || [])];
          const mergedEdges = [...(nextWorkspace.graph?.edges || []), ...(validWorkspace.graph?.edges || [])];
          nextWorkspace = {
            ...nextWorkspace,
            graph: {
              nodes: mergedNodes,
              edges: mergedEdges
            }
          };
          return;
        }

        if (preview.kind === 'todos') {
          const importedTodos = (preview.todos || []).map((todo) => ({
            ...todo,
            id: makeId('todo'),
            listId: scopeListId,
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));

          if (importMode === 'replace') {
            nextTodos = nextTodos.filter((todo) => todo.listId !== scopeListId);
          }

          nextTodos = [...nextTodos, ...importedTodos];
          return;
        }

        if (preview.kind === 'graph') {
          nextWorkspace = {
            ...nextWorkspace,
            graph: {
              nodes:
                importMode === 'replace'
                  ? [...(preview.payload?.nodes || [])]
                  : [...(nextWorkspace.graph?.nodes || []), ...(preview.payload?.nodes || [])],
              edges:
                importMode === 'replace'
                  ? [...(preview.payload?.edges || [])]
                  : [...(nextWorkspace.graph?.edges || []), ...(preview.payload?.edges || [])]
            }
          };
        }
      });

      if (nextWorkspace !== prevWorkspace && importMode === 'replace' && importPreviews.some((entry) => entry.kind === 'workspace')) {
        return nextWorkspace;
      }

      const listBuckets = new Map();
      nextTodos.forEach((todo) => {
        const bucket = listBuckets.get(todo.listId) || [];
        bucket.push(todo);
        listBuckets.set(todo.listId, bucket);
      });

      const normalizedTodos = [];
      listBuckets.forEach((bucketTodos) => {
        bucketTodos
          .sort((a, b) => a.order - b.order)
          .forEach((todo, index) => {
            normalizedTodos.push({ ...todo, order: index });
          });
      });

      return {
        ...nextWorkspace,
        todos: normalizedTodos
      };
    });

    if (importMode === 'replace' && importPreviews.some((entry) => entry.kind === 'workspace')) {
      const workspacePreview = importPreviews.find((entry) => entry.kind === 'workspace');
      const nextWorkspace = workspacePreview ? validateWorkspace(workspacePreview.payload).workspace : null;
      if (nextWorkspace?.lists?.[0]?.id) {
        setActiveListId(nextWorkspace.preferences?.activeListId || nextWorkspace.lists[0].id);
      }
    }

    setImportPreviews([]);
    notify('success', 'Import applied.');
  }

  function handleClearImportPreview() {
    setImportPreviews([]);
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

        setActiveListId(normalized.preferences?.activeListId || normalized.lists[0]?.id);
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
    if (!file || !activeList?.id) {
      return;
    }

    setBusyAction('open');
    setErrorMessage('');

    try {
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        const importedTodos = importTodosFromCsv(text, activeList.id).map((todo, index) => ({
          ...todo,
          id: makeId('todo'),
          listId: activeList.id,
          order: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        replaceActiveListTodos(importedTodos);
        notify('success', `Opened CSV and replaced current list with ${importedTodos.length} todos.`);
        return;
      }

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

      setActiveListId(normalized.preferences?.activeListId || normalized.lists[0]?.id);
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
      const workspaceWithPrefs = {
        ...workspace,
        preferences: {
          ...workspace.preferences,
          activeListId
        }
      };

      if (fileHandle) {
        await saveWorkspaceWithHandle(workspaceWithPrefs, fileHandle);
        registerRecentFile({ name: fileName, source: 'save' });
      } else if (supportsFileSystemAccessApi()) {
        const saveResult = await saveWorkspaceAsViaPicker(workspaceWithPrefs, fileName);
        setFileHandle(saveResult.fileHandle);
        setFileName(saveResult.fileName || fileName);
      } else {
        const fallbackName = fileName || DEFAULT_FILE_NAME;
        downloadWorkspaceFile(workspaceWithPrefs, fallbackName);
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
      const workspaceWithPrefs = {
        ...workspace,
        preferences: {
          ...workspace.preferences,
          activeListId
        }
      };

      if (supportsFileSystemAccessApi()) {
        const suggestedName = fileName || DEFAULT_FILE_NAME;
        const saveResult = await saveWorkspaceAsViaPicker(workspaceWithPrefs, suggestedName);
        setFileHandle(saveResult.fileHandle);
        setFileName(saveResult.fileName || suggestedName);
      } else {
        const requestedName = window.prompt('Save as filename', fileName || DEFAULT_FILE_NAME);
        if (!requestedName) {
          setBusyAction('');
          return;
        }
        const normalizedName = requestedName.endsWith('.json') || requestedName.endsWith('.todo')
          ? requestedName
          : `${requestedName}.todo.json`;
        downloadWorkspaceFile(workspaceWithPrefs, normalizedName);
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

    const fresh = loadWorkspaceFromStorage().workspace;
    setWorkspace(fresh);
    setActiveListId(fresh.preferences.activeListId || fresh.lists[0]?.id);

    setRecentFiles([]);
    setBackups([]);
    setFileName(DEFAULT_FILE_NAME);
    setFileHandle(null);
    setQuotaStatus(getStorageQuotaStatus());
    setSavedFilters([]);
    setFilters(createDefaultFilters());
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

  function handleExportConfigChange(key, value) {
    setExportConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function handleOpenContextMenu(todoId, x, y) {
    setContextMenu({ todoId, x, y });
  }

  function handleGraphChange(nextGraphOrUpdater, { recordHistory = true } = {}) {
    commitWorkspace(
      (prevWorkspace) => {
        const currentGraph = prevWorkspace.graph || { nodes: [], edges: [] };
        const nextGraph =
          typeof nextGraphOrUpdater === 'function' ? nextGraphOrUpdater(currentGraph) : nextGraphOrUpdater;

        return {
          ...prevWorkspace,
          graph: nextGraph
        };
      },
      { recordHistory }
    );
  }

  function handleJumpToTodo(todoId) {
    const todo = workspace.todos.find((entry) => entry.id === todoId);
    if (!todo) {
      notify('warning', 'Linked todo could not be found.');
      return;
    }

    setViewMode('list');
    setActiveListId(todo.listId);
    setFocusedTodoId(todo.id);
    setSelectedTodoIds([todo.id]);
  }

  function handleContextAction(action, todoId) {
    setContextMenu(null);

    if (action === 'duplicate') {
      handleDuplicateTodo(todoId);
      return;
    }
    if (action === 'archive') {
      handleArchiveTodo(todoId);
      return;
    }
    if (action === 'restore') {
      handleRestoreTodo(todoId);
      return;
    }
    if (action === 'delete') {
      handleDeleteTodo(todoId);
      return;
    }
    if (action === 'select') {
      handleToggleSelect(todoId);
    }
  }

  useEffect(() => {
    workspaceRef.current = workspace;
    const workspaceWithPrefs = {
      ...workspace,
      preferences: {
        ...workspace.preferences,
        activeListId
      }
    };

    saveWorkspaceToStorage(workspaceWithPrefs);

    const nextQuotaStatus = getStorageQuotaStatus();
    setQuotaStatus(nextQuotaStatus);

    writeSettings({
      theme: workspace.preferences.theme,
      autosaveMinutes: workspace.preferences.autosaveMinutes,
      activeListId,
      savedFilters
    });

    if (nextQuotaStatus.warning && !previousQuotaWarningRef.current) {
      notify('warning', 'Local storage is almost full. Consider clearing data or exporting backups.');
    }
    previousQuotaWarningRef.current = nextQuotaStatus.warning;
  }, [workspace, activeListId, savedFilters]);

  useEffect(() => {
    document.body.dataset.theme = workspace.preferences.theme;
  }, [workspace.preferences.theme]);

  useEffect(() => {
    if (boot.errors.length > 0) {
      notify('warning', `Workspace was repaired on load: ${boot.errors.join(' ')}`);
    }
  }, [boot.errors]);

  useEffect(() => {
    if (!workspace.lists.some((list) => list.id === activeListId)) {
      setActiveListId(workspace.lists[0]?.id || null);
    }
  }, [workspace.lists, activeListId]);

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
    if (!timer.running) {
      return undefined;
    }

    const tickId = window.setInterval(() => {
      setTimer((prev) => {
        if (!prev.running) {
          return prev;
        }

        if (prev.remainingSec <= 1) {
          applyTrackedMinutes(prev.todoId, 25);
          notify('success', 'Pomodoro complete. Added 25 tracked minutes.');
          return {
            todoId: null,
            running: false,
            remainingSec: DEFAULT_TIMER_SECONDS
          };
        }

        return {
          ...prev,
          remainingSec: prev.remainingSec - 1
        };
      });
    }, 1000);

    return () => window.clearInterval(tickId);
  }, [timer.running]);

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

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null);
    }

    function onEscape(event) {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    }

    window.addEventListener('click', closeContextMenu);
    window.addEventListener('contextmenu', closeContextMenu);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('contextmenu', closeContextMenu);
      window.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <section
      className="workspace-shell"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const files = event.dataTransfer?.files ? [...event.dataTransfer.files] : [];
        void handleImportFiles(files);
      }}
    >
      <input
        ref={openInputRef}
        type="file"
        accept=".json,.todo,.csv,application/json,text/csv"
        hidden
        onChange={(event) => {
          void handleOpenFromInput(event);
        }}
      />

      <input
        ref={importInputRef}
        type="file"
        accept=".json,.todo,.csv,.md,.markdown,.txt,.opml"
        hidden
        multiple
        onChange={(event) => {
          const files = event.target.files ? [...event.target.files] : [];
          void handleImportFiles(files);
          event.target.value = '';
        }}
      />

      <ToastShelf toasts={toasts} onDismiss={dismissToast} />

      <WorkspaceHeader
        theme={workspace.preferences.theme}
        undoCount={pastRef.current.length}
        redoCount={futureRef.current.length}
        viewMode={viewMode}
        onThemeToggle={handleThemeToggle}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onViewModeChange={setViewMode}
        activeListName={activeList?.name || 'Untitled list'}
        visibleTodoCount={filteredTodos.length}
        totalListTodos={listTodos.length}
      />

      <div className="workspace-grid">
        <WorkspaceSidebar
          title={workspace.meta.title}
          updatedAtLabel={formatRelativeDate(workspace.meta.updatedAt)}
          lists={lists}
          activeListId={activeList?.id}
          showArchivedLists={showArchivedLists}
          onToggleShowArchivedLists={setShowArchivedLists}
          onCreateList={handleCreateList}
          onSelectList={(listId) => {
            setActiveListId(listId);
            setSelectedTodoIds([]);
            setFocusedTodoId(null);
          }}
          onRenameList={handleRenameList}
          onDeleteList={handleDeleteList}
          onMoveList={handleMoveList}
          onArchiveList={handleArchiveList}
          onRestoreList={handleRestoreList}
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
          importMode={importMode}
          onImportModeChange={setImportMode}
          onPickImportFiles={() => importInputRef.current?.click()}
          importPreviews={importPreviews}
          onApplyImports={handleApplyImports}
          onClearImportPreview={handleClearImportPreview}
          exportConfig={exportConfig}
          onExportConfigChange={handleExportConfigChange}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onExportMarkdown={handleExportMarkdown}
          onExportTxt={handleExportTxt}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
          onExportImages={handleExportImages}
        />

        {viewMode === 'graph' ? (
          <GraphWorkspace
            graph={workspace.graph}
            todos={workspace.todos}
            onGraphChange={handleGraphChange}
            onNotify={notify}
            onJumpToTodo={handleJumpToTodo}
          />
        ) : (
          <WorkspaceMain
            composerInputRef={addInputRef}
            quotaStatus={quotaStatus}
            formatBytes={formatBytes}
            errorMessage={errorMessage}
            activeListName={activeList?.name || 'Current list'}
            newTodoText={newTodoText}
            onNewTodoTextChange={setNewTodoText}
            onComposerEnter={handleAddTodo}
            onAddTodo={handleAddTodo}
            quickPriority={quickPriority}
            onQuickPriorityChange={setQuickPriority}
            quickDueDate={quickDueDate}
            onQuickDueDateChange={setQuickDueDate}
            quickTags={quickTags}
            onQuickTagsChange={setQuickTags}
            todos={filteredTodos}
            allListTodosCount={listTodos.length}
            completedCount={completedCount}
            pendingCount={pendingCount}
            archivedCount={archivedCount}
            selectedTodoIds={selectedTodoIds}
            onToggleSelect={handleToggleSelect}
            onSelectAllFiltered={handleSelectAllFiltered}
            onClearSelection={handleClearSelection}
            onClearCompleted={handleClearCompleted}
            onArchiveCompleted={handleArchiveCompleted}
            onClearAll={handleClearAll}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            availableTags={availableTags}
            savedFilters={savedFilters}
            onSaveCurrentFilters={handleSaveCurrentFilters}
            onApplySavedFilter={handleApplySavedFilter}
            onDeleteSavedFilter={handleDeleteSavedFilter}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            dragDisabled={dragDisabled}
            editingId={editingId}
            editingDraft={editingDraft}
            onDraftChange={setEditingDraft}
            onBeginEdit={handleBeginEdit}
            onCommitEdit={handleCommitEdit}
            onCancelEdit={handleCancelEdit}
            onToggle={handleToggleTodo}
            onDuplicate={handleDuplicateTodo}
            onArchive={handleArchiveTodo}
            onRestore={handleRestoreTodo}
            onDelete={handleDeleteTodo}
            onOpenContextMenu={handleOpenContextMenu}
            focusedTodo={focusedTodo}
            timer={timer}
            onPatchTodo={handlePatchTodo}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onAttachFiles={handleAttachFiles}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onResetTimer={handleResetTimer}
            onBulkSetPriority={handleBulkSetPriority}
            onBulkDelete={handleBulkDelete}
            onBulkArchive={handleBulkArchive}
            onFocusTodo={setFocusedTodoId}
          />
        )}
      </div>

      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button type="button" onClick={() => handleContextAction('select', contextMenu.todoId)}>
            Select / Unselect
          </button>
          <button type="button" onClick={() => handleContextAction('duplicate', contextMenu.todoId)}>
            Duplicate
          </button>
          <button type="button" onClick={() => handleContextAction('archive', contextMenu.todoId)}>
            Archive
          </button>
          <button type="button" onClick={() => handleContextAction('restore', contextMenu.todoId)}>
            Restore
          </button>
          <button type="button" onClick={() => handleContextAction('delete', contextMenu.todoId)}>
            Delete
          </button>
        </div>
      )}
    </section>
  );
}
