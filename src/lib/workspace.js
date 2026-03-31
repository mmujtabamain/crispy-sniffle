const APP_PREFIX = 'crispySniffle';

export const STORAGE_KEYS = {
  workspace: `${APP_PREFIX}.workspace`,
  backups: `${APP_PREFIX}.backups`,
  recentFiles: `${APP_PREFIX}.recentFiles`,
  settings: `${APP_PREFIX}.settings`
};

export const CURRENT_SCHEMA_VERSION = 2;
const MAX_BACKUPS = 20;
const MAX_RECENT_FILES = 10;
const STORAGE_WARNING_RATIO = 0.8;
const DEFAULT_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;
const TODO_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TODO_STATUSES = ['todo', 'doing', 'done', 'blocked'];
const TODO_RECURRENCES = ['none', 'daily', 'weekly', 'monthly'];

function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createList(name = 'Inbox') {
  const timestamp = nowIso();
  return {
    id: makeId('list'),
    name,
    icon: '📥',
    color: '#b08968',
    archived: false,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    order: 0
  };
}

export function createTodo(text, listId, overrides = {}) {
  const timestamp = nowIso();
  return {
    id: makeId('todo'),
    listId,
    text: text.trim(),
    completed: false,
    priority: 'medium',
    tags: [],
    dueDate: null,
    recurrence: 'none',
    description: '',
    subtasks: [],
    status: 'todo',
    estimateMinutes: null,
    actualMinutes: 0,
    notes: '',
    links: [],
    attachments: [],
    category: '',
    archived: false,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    order: 0,
    ...overrides
  };
}

export function createNode(label = 'Node') {
  const timestamp = nowIso();
  return {
    id: makeId('node'),
    label,
    x: 0,
    y: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createEdge(from, to) {
  const timestamp = nowIso();
  return {
    id: makeId('edge'),
    from,
    to,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createWorkspace() {
  const timestamp = nowIso();
  const defaultList = createList('Inbox');

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: {
      id: makeId('workspace'),
      title: 'Untitled Workspace',
      createdAt: timestamp,
      updatedAt: timestamp,
      lastOpenedAt: timestamp
    },
    preferences: {
      theme: 'light',
      autosaveMinutes: 5,
      activeListId: defaultList.id
    },
    lists: [{ ...defaultList, order: 0 }],
    todos: [],
    graph: {
      nodes: [],
      edges: []
    }
  };
}

function migrateV0ToV1(raw) {
  if (Array.isArray(raw)) {
    const workspace = createWorkspace();
    workspace.todos = raw
      .map((todoText, index) => {
        if (typeof todoText !== 'string') {
          return null;
        }
        const todo = createTodo(todoText, workspace.lists[0].id);
        todo.order = index;
        return todo;
      })
      .filter(Boolean);
    workspace.meta.updatedAt = nowIso();
    return workspace;
  }

  const base = {
    ...createWorkspace(),
    ...raw,
    schemaVersion: 1
  };
  return base;
}

function migrateV1ToV2(raw) {
  if (!raw || typeof raw !== 'object') {
    return createWorkspace();
  }

  const timestamp = nowIso();
  const lists = Array.isArray(raw.lists) ? raw.lists : [];
  const fallbackListId = lists[0]?.id || createList('Inbox').id;

  return {
    ...raw,
    schemaVersion: 2,
    preferences: {
      ...(raw.preferences || {}),
      activeListId: raw.preferences?.activeListId || fallbackListId
    },
    lists: lists.map((list, index) => ({
      icon: '📋',
      color: '#b08968',
      archived: false,
      archivedAt: null,
      order: index,
      ...list,
      updatedAt: list?.updatedAt || timestamp
    })),
    todos: Array.isArray(raw.todos)
      ? raw.todos.map((todo, index) => ({
          ...createTodo(todo?.text || 'Untitled task', todo?.listId || fallbackListId),
          ...todo,
          priority: TODO_PRIORITIES.includes(todo?.priority) ? todo.priority : 'medium',
          status: TODO_STATUSES.includes(todo?.status) ? todo.status : 'todo',
          recurrence: TODO_RECURRENCES.includes(todo?.recurrence) ? todo.recurrence : 'none',
          tags: Array.isArray(todo?.tags) ? todo.tags : [],
          links: Array.isArray(todo?.links) ? todo.links : [],
          subtasks: Array.isArray(todo?.subtasks) ? todo.subtasks : [],
          attachments: Array.isArray(todo?.attachments) ? todo.attachments : [],
          order: Number.isFinite(todo?.order) ? Number(todo.order) : index,
          archived: Boolean(todo?.archived),
          archivedAt: typeof todo?.archivedAt === 'string' ? todo.archivedAt : null
        }))
      : []
  };
}

export function migrateWorkspace(rawWorkspace) {
  if (!rawWorkspace || typeof rawWorkspace !== 'object') {
    return createWorkspace();
  }

  const initialVersion = Number(rawWorkspace.schemaVersion) || 0;
  let nextWorkspace = rawWorkspace;

  if (initialVersion < 1) {
    nextWorkspace = migrateV0ToV1(nextWorkspace);
  }

  if (initialVersion < 2) {
    nextWorkspace = migrateV1ToV2(nextWorkspace);
  }

  return {
    ...nextWorkspace,
    schemaVersion: CURRENT_SCHEMA_VERSION
  };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function normalizeSubtasks(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      id: typeof entry.id === 'string' ? entry.id : makeId('subtask'),
      text: typeof entry.text === 'string' && entry.text.trim() ? entry.text.trim() : 'Untitled subtask',
      completed: Boolean(entry.completed)
    }));
}

function normalizeAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      id: typeof entry.id === 'string' ? entry.id : makeId('attachment'),
      name: typeof entry.name === 'string' ? entry.name : 'attachment',
      type: typeof entry.type === 'string' ? entry.type : 'application/octet-stream',
      size: Number.isFinite(entry.size) ? Number(entry.size) : 0,
      previewUrl: typeof entry.previewUrl === 'string' ? entry.previewUrl : null
    }));
}

export function validateWorkspace(workspace) {
  const errors = [];
  if (!workspace || typeof workspace !== 'object') {
    return {
      valid: false,
      errors: ['Workspace is not an object.'],
      workspace: createWorkspace()
    };
  }

  const migrated = migrateWorkspace(workspace);
  const baselineWorkspace = createWorkspace();
  const baselineMeta = baselineWorkspace.meta;
  const baselinePreferences = baselineWorkspace.preferences;
  const safeWorkspace = {
    ...baselineWorkspace,
    ...migrated,
    meta: {
      ...baselineMeta,
      ...(migrated.meta || {})
    },
    preferences: {
      ...baselinePreferences,
      ...(migrated.preferences || {})
    },
    graph: {
      nodes: Array.isArray(migrated.graph?.nodes) ? migrated.graph.nodes : [],
      edges: Array.isArray(migrated.graph?.edges) ? migrated.graph.edges : []
    }
  };

  if (!Array.isArray(migrated.lists) || migrated.lists.length === 0) {
    errors.push('Workspace must include at least one list.');
    safeWorkspace.lists = [createList('Inbox')];
  } else {
    safeWorkspace.lists = migrated.lists
      .filter((list) => list && typeof list === 'object' && typeof list.name === 'string')
      .map((list, index) => ({
        id: typeof list.id === 'string' ? list.id : makeId('list'),
        name: list.name.trim() || `List ${index + 1}`,
        icon: typeof list.icon === 'string' && list.icon.trim() ? list.icon.trim() : '📋',
        color: typeof list.color === 'string' && list.color.trim() ? list.color.trim() : '#b08968',
        archived: Boolean(list.archived),
        archivedAt: typeof list.archivedAt === 'string' ? list.archivedAt : null,
        createdAt: typeof list.createdAt === 'string' ? list.createdAt : nowIso(),
        updatedAt: typeof list.updatedAt === 'string' ? list.updatedAt : nowIso(),
        order: Number.isFinite(list.order) ? Number(list.order) : index
      }));

    if (safeWorkspace.lists.length === 0) {
      safeWorkspace.lists = [createList('Inbox')];
    }
  }

  const validListIds = new Set(safeWorkspace.lists.map((list) => list.id));

  if (!Array.isArray(migrated.todos)) {
    errors.push('Todos must be an array.');
    safeWorkspace.todos = [];
  } else {
    safeWorkspace.todos = migrated.todos
      .filter((todo) => todo && typeof todo === 'object' && typeof todo.text === 'string')
      .map((todo, index) => {
        const resolvedListId = validListIds.has(todo.listId)
          ? todo.listId
          : safeWorkspace.lists[0].id;

        return {
          id: typeof todo.id === 'string' ? todo.id : makeId('todo'),
          listId: resolvedListId,
          text: todo.text.trim() || 'Untitled task',
          completed: Boolean(todo.completed),
          priority: TODO_PRIORITIES.includes(todo.priority) ? todo.priority : 'medium',
          tags: normalizeStringArray(todo.tags),
          dueDate: typeof todo.dueDate === 'string' && todo.dueDate.trim() ? todo.dueDate : null,
          recurrence: TODO_RECURRENCES.includes(todo.recurrence) ? todo.recurrence : 'none',
          description: typeof todo.description === 'string' ? todo.description : '',
          subtasks: normalizeSubtasks(todo.subtasks),
          status: TODO_STATUSES.includes(todo.status) ? todo.status : 'todo',
          estimateMinutes: Number.isFinite(todo.estimateMinutes) ? Number(todo.estimateMinutes) : null,
          actualMinutes: Number.isFinite(todo.actualMinutes) ? Number(todo.actualMinutes) : 0,
          notes: typeof todo.notes === 'string' ? todo.notes : '',
          links: normalizeStringArray(todo.links),
          attachments: normalizeAttachments(todo.attachments),
          category: typeof todo.category === 'string' ? todo.category : '',
          archived: Boolean(todo.archived),
          archivedAt: typeof todo.archivedAt === 'string' ? todo.archivedAt : null,
          createdAt: typeof todo.createdAt === 'string' ? todo.createdAt : nowIso(),
          updatedAt: typeof todo.updatedAt === 'string' ? todo.updatedAt : nowIso(),
          order: Number.isFinite(todo.order) ? Number(todo.order) : index
        };
      });
  }

  const validListIdsAfterValidation = new Set(safeWorkspace.lists.map((list) => list.id));
  if (!validListIdsAfterValidation.has(safeWorkspace.preferences.activeListId)) {
    safeWorkspace.preferences.activeListId = safeWorkspace.lists[0].id;
  }

  safeWorkspace.graph.nodes = safeWorkspace.graph.nodes
    .filter((node) => node && typeof node === 'object')
    .map((node) => ({
      id: typeof node.id === 'string' ? node.id : makeId('node'),
      label: typeof node.label === 'string' ? node.label : 'Node',
      x: Number.isFinite(node.x) ? Number(node.x) : 0,
      y: Number.isFinite(node.y) ? Number(node.y) : 0,
      createdAt: typeof node.createdAt === 'string' ? node.createdAt : nowIso(),
      updatedAt: typeof node.updatedAt === 'string' ? node.updatedAt : nowIso()
    }));

  const validNodeIds = new Set(safeWorkspace.graph.nodes.map((node) => node.id));

  safeWorkspace.graph.edges = safeWorkspace.graph.edges
    .filter((edge) => edge && typeof edge === 'object')
    .map((edge) => ({
      id: typeof edge.id === 'string' ? edge.id : makeId('edge'),
      from: typeof edge.from === 'string' ? edge.from : '',
      to: typeof edge.to === 'string' ? edge.to : '',
      createdAt: typeof edge.createdAt === 'string' ? edge.createdAt : nowIso(),
      updatedAt: typeof edge.updatedAt === 'string' ? edge.updatedAt : nowIso()
    }))
    .filter((edge) => validNodeIds.has(edge.from) && validNodeIds.has(edge.to));

  if (safeWorkspace.todos.length > 0 && safeWorkspace.todos.some((todo) => todo.text.length === 0)) {
    errors.push('One or more todos had empty text and were repaired.');
  }

  safeWorkspace.meta.updatedAt = nowIso();
  return {
    valid: errors.length === 0,
    errors,
    workspace: safeWorkspace
  };
}

function safeParseJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

export function loadWorkspaceFromStorage() {
  const storage = getStorage();
  if (!storage) {
    return {
      source: 'fallback',
      valid: true,
      errors: [],
      workspace: createWorkspace()
    };
  }

  const raw = storage.getItem(STORAGE_KEYS.workspace);
  if (!raw) {
    return {
      source: 'default',
      valid: true,
      errors: [],
      workspace: createWorkspace()
    };
  }

  const parsed = safeParseJson(raw);
  if (!parsed) {
    return {
      source: 'repaired',
      valid: false,
      errors: ['Local workspace JSON is invalid and was reset.'],
      workspace: createWorkspace()
    };
  }

  const validation = validateWorkspace(parsed);
  return {
    source: 'storage',
    valid: validation.valid,
    errors: validation.errors,
    workspace: validation.workspace
  };
}

export function saveWorkspaceToStorage(workspace) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const payload = JSON.stringify(workspace);
  storage.setItem(STORAGE_KEYS.workspace, payload);
}

export function clearAllLocalData() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  Object.values(STORAGE_KEYS).forEach((key) => {
    storage.removeItem(key);
  });
}

export function serializeWorkspace(workspace) {
  return JSON.stringify(workspace, null, 2);
}

export function deserializeWorkspace(rawText) {
  const parsed = safeParseJson(rawText);
  if (!parsed) {
    throw new Error('Could not parse workspace JSON file.');
  }

  const validation = validateWorkspace(parsed);
  if (!validation.valid) {
    return {
      workspace: validation.workspace,
      warnings: validation.errors
    };
  }

  return {
    workspace: validation.workspace,
    warnings: []
  };
}

export function listBackups() {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  const raw = storage.getItem(STORAGE_KEYS.backups);
  const parsed = raw ? safeParseJson(raw) : [];
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed;
}

export function createBackupSnapshot(workspace) {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const backup = {
    id: makeId('backup'),
    createdAt: nowIso(),
    sizeBytes: new Blob([JSON.stringify(workspace)]).size,
    workspace
  };

  const current = listBackups();
  const next = [backup, ...current].slice(0, MAX_BACKUPS);
  storage.setItem(STORAGE_KEYS.backups, JSON.stringify(next));
  return backup;
}

export function readSettings() {
  const storage = getStorage();
  if (!storage) {
    return {};
  }
  const raw = storage.getItem(STORAGE_KEYS.settings);
  const parsed = raw ? safeParseJson(raw) : {};
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export function writeSettings(nextSettings) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEYS.settings, JSON.stringify(nextSettings));
}

export function getRecentFiles() {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  const raw = storage.getItem(STORAGE_KEYS.recentFiles);
  const parsed = raw ? safeParseJson(raw) : [];
  return Array.isArray(parsed) ? parsed : [];
}

export function registerRecentFile(fileMeta) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const now = nowIso();
  const current = getRecentFiles();
  const nextItem = {
    id: makeId('recent'),
    name: fileMeta?.name || 'Untitled workspace',
    source: fileMeta?.source || 'local',
    timestamp: now
  };

  const deduped = current.filter((entry) => entry.name !== nextItem.name);
  const next = [nextItem, ...deduped].slice(0, MAX_RECENT_FILES);
  storage.setItem(STORAGE_KEYS.recentFiles, JSON.stringify(next));
}

export function estimateStorageUsageBytes() {
  const storage = getStorage();
  if (!storage) {
    return 0;
  }

  let total = 0;
  Object.values(STORAGE_KEYS).forEach((key) => {
    const value = storage.getItem(key);
    if (typeof value === 'string') {
      total += new Blob([value]).size;
    }
  });
  return total;
}

export function getStorageQuotaStatus() {
  const usedBytes = estimateStorageUsageBytes();
  const quotaBytes = DEFAULT_STORAGE_QUOTA_BYTES;
  const ratio = quotaBytes === 0 ? 0 : usedBytes / quotaBytes;

  return {
    usedBytes,
    quotaBytes,
    ratio,
    warning: ratio >= STORAGE_WARNING_RATIO
  };
}

export async function openWorkspaceFromFile(file) {
  const content = await file.text();
  const { workspace, warnings } = deserializeWorkspace(content);
  registerRecentFile({ name: file.name, source: 'import' });
  return { workspace, warnings };
}

export function downloadWorkspaceFile(workspace, fileName = 'workspace.todo.json') {
  const payload = serializeWorkspace(workspace);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  registerRecentFile({ name: fileName, source: 'export' });
}

const pickerTypes = [
  {
    description: 'Todo workspace files',
    accept: {
      'application/json': ['.todo', '.json']
    }
  }
];

export function supportsFileSystemAccessApi() {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

export async function openWorkspaceViaPicker() {
  if (!supportsFileSystemAccessApi()) {
    throw new Error('File System Access API is unavailable in this browser.');
  }

  const [fileHandle] = await window.showOpenFilePicker({
    multiple: false,
    types: pickerTypes
  });

  const file = await fileHandle.getFile();
  const content = await file.text();
  const { workspace, warnings } = deserializeWorkspace(content);

  registerRecentFile({ name: file.name, source: 'picker-open' });

  return {
    workspace,
    warnings,
    fileHandle,
    fileName: file.name
  };
}

export async function saveWorkspaceWithHandle(workspace, fileHandle) {
  if (!fileHandle) {
    throw new Error('Missing file handle for save operation.');
  }

  const writable = await fileHandle.createWritable();
  await writable.write(serializeWorkspace(workspace));
  await writable.close();
}

export async function saveWorkspaceAsViaPicker(workspace, suggestedName = 'workspace.todo.json') {
  if (!supportsFileSystemAccessApi() || !('showSaveFilePicker' in window)) {
    throw new Error('File System Access API is unavailable in this browser.');
  }

  const fileHandle = await window.showSaveFilePicker({
    suggestedName,
    types: pickerTypes
  });

  await saveWorkspaceWithHandle(workspace, fileHandle);
  registerRecentFile({ name: suggestedName, source: 'picker-save' });
  return { fileHandle, fileName: suggestedName };
}
