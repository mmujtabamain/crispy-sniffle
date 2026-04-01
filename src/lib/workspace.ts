type Priority = 'low' | 'medium' | 'high' | 'critical';
type Status = 'todo' | 'doing' | 'done' | 'blocked';
type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';
type NodeShape = 'circle' | 'square' | 'diamond' | 'pill';
type NodeSize = 'sm' | 'md' | 'lg';
type EdgeType = 'curved' | 'straight' | 'orthogonal';
type Theme = 'light' | 'dark';
type ImportMode = 'merge' | 'replace';
type FileSource =
  | 'local'
  | 'import'
  | 'export'
  | 'picker-open'
  | 'picker-save'
  | 'save'
  | 'export-json'
  | 'export-csv'
  | 'export-md'
  | 'export-txt';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl: string | null;
}

export interface List {
  id: string;
  name: string;
  icon: string;
  color: string;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Todo {
  id: string;
  listId: string;
  text: string;
  completed: boolean;
  priority: Priority;
  tags: string[];
  dueDate: string | null;
  recurrence: Recurrence;
  description: string;
  subtasks: Subtask[];
  status: Status;
  estimateMinutes: number | null;
  actualMinutes: number;
  notes: string;
  links: string[];
  attachments: Attachment[];
  category: string;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface GraphNode {
  id: string;
  label: string;
  description: string;
  tags: string[];
  priority: Priority;
  status: Status;
  completed: boolean;
  icon: string;
  shape: NodeShape;
  size: NodeSize;
  color: string;
  textColor: string;
  borderColor: string;
  shadow: boolean;
  opacity: number;
  alias: string;
  todoId: string | null;
  owner: string;
  collapsed: boolean;
  estimateMinutes: number | null;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  createdAt: string;
  updatedAt: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface WorkspaceMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

export interface WorkspacePreferences {
  theme: Theme;
  autosaveMinutes: number;
  activeListId: string;
}

export interface Workspace {
  schemaVersion: number;
  meta: WorkspaceMeta;
  preferences: WorkspacePreferences;
  lists: List[];
  todos: Todo[];
  graph: Graph;
}

interface BackupSnapshot {
  id: string;
  createdAt: string;
  sizeBytes: number;
  workspace: Workspace;
}

interface RecentFile {
  id: string;
  name: string;
  source: FileSource;
  timestamp: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  workspace: Workspace;
}

interface LoadResult {
  source: 'default' | 'storage' | 'repaired' | 'fallback';
  valid: boolean;
  errors: string[];
  workspace: Workspace;
}

const APP_PREFIX = 'crispySniffle';

export const STORAGE_KEYS: Record<string, string> = {
  workspace: `${APP_PREFIX}.workspace`,
  backups: `${APP_PREFIX}.backups`,
  recentFiles: `${APP_PREFIX}.recentFiles`,
  settings: `${APP_PREFIX}.settings`
};

export const CURRENT_SCHEMA_VERSION = 3;
const MAX_BACKUPS = 20;
const MAX_RECENT_FILES = 10;
const STORAGE_WARNING_RATIO = 0.8;
const DEFAULT_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;
const TODO_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
const TODO_STATUSES: Status[] = ['todo', 'doing', 'done', 'blocked'];
const TODO_RECURRENCES: Recurrence[] = ['none', 'daily', 'weekly', 'monthly'];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function isPriority(value: unknown): value is Priority {
  return TODO_PRIORITIES.includes(value as Priority);
}

function isStatus(value: unknown): value is Status {
  return TODO_STATUSES.includes(value as Status);
}

function isRecurrence(value: unknown): value is Recurrence {
  return TODO_RECURRENCES.includes(value as Recurrence);
}

function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createList(name: string = 'Inbox'): List {
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

export function createTodo(text: string, listId: string, overrides: Partial<Todo> = {}): Todo {
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

export function createNode(label: string = 'Node'): GraphNode {
  const timestamp = nowIso();
  return {
    id: makeId('node'),
    label,
    description: '',
    tags: [],
    priority: 'medium',
    status: 'todo',
    completed: false,
    icon: '◉',
    shape: 'square',
    size: 'md',
    color: '#b08968',
    textColor: '#2e241f',
    borderColor: '#8a6042',
    shadow: true,
    opacity: 1,
    alias: '',
    todoId: null,
    owner: '',
    collapsed: false,
    estimateMinutes: null,
    x: 0,
    y: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createEdge(from: string, to: string): GraphEdge {
  const timestamp = nowIso();
  return {
    id: makeId('edge'),
    from,
    to,
    type: 'curved',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createWorkspace(): Workspace {
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

function migrateV0ToV1(raw: unknown): Workspace {
  if (Array.isArray(raw)) {
    const workspace = createWorkspace();
    workspace.todos = raw
      .map((todoText: unknown, index: number) => {
        if (typeof todoText !== 'string') {
          return null;
        }
        const todo = createTodo(todoText, workspace.lists[0].id);
        todo.order = index;
        return todo;
      })
      .filter((todo): todo is Todo => todo !== null);
    workspace.meta.updatedAt = nowIso();
    return workspace;
  }

  const source = asRecord(raw);
  const seeded = createWorkspace();
  const sourceGraph = asRecord(source.graph);

  return {
    ...seeded,
    schemaVersion: 1,
    meta: {
      ...seeded.meta,
      ...asRecord(source.meta)
    },
    preferences: {
      ...seeded.preferences,
      ...asRecord(source.preferences)
    },
    lists: Array.isArray(source.lists) ? (source.lists as List[]) : seeded.lists,
    todos: Array.isArray(source.todos) ? (source.todos as Todo[]) : seeded.todos,
    graph: {
      nodes: Array.isArray(sourceGraph.nodes) ? (sourceGraph.nodes as GraphNode[]) : [],
      edges: Array.isArray(sourceGraph.edges) ? (sourceGraph.edges as GraphEdge[]) : []
    }
  };
}

function migrateV1ToV2(raw: unknown): Workspace {
  const source = asRecord(raw);
  const seeded = migrateV0ToV1(raw);
  const timestamp = nowIso();
  const lists = Array.isArray(source.lists) ? source.lists : [];
  const fallbackListId =
    typeof (lists[0] as UnknownRecord | undefined)?.id === 'string'
      ? String((lists[0] as UnknownRecord).id)
      : createList('Inbox').id;
  const sourcePreferences = asRecord(source.preferences);
  const todoRows = Array.isArray(source.todos) ? source.todos : [];

  return {
    ...seeded,
    schemaVersion: 2,
    preferences: {
      ...seeded.preferences,
      ...sourcePreferences,
      activeListId:
        typeof sourcePreferences.activeListId === 'string' && sourcePreferences.activeListId
          ? sourcePreferences.activeListId
          : fallbackListId
    },
    lists: lists.map((listValue: unknown, index: number) => {
      const list = asRecord(listValue);
      const baseList = createList(
        typeof list.name === 'string' && list.name.trim() ? list.name : `List ${index + 1}`
      );
      return {
        ...baseList,
        icon: '📋',
        color: '#b08968',
        archived: false,
        archivedAt: null,
        order: index,
        ...list,
        updatedAt: typeof list.updatedAt === 'string' ? list.updatedAt : timestamp
      };
    }),
    todos: todoRows.map((todoValue: unknown, index: number) => {
      const todo = asRecord(todoValue);
      return {
        ...createTodo(
          typeof todo.text === 'string' ? todo.text : 'Untitled task',
          typeof todo.listId === 'string' ? todo.listId : fallbackListId
        ),
        ...todo,
        priority: isPriority(todo.priority) ? todo.priority : 'medium',
        status: isStatus(todo.status) ? todo.status : 'todo',
        recurrence: isRecurrence(todo.recurrence) ? todo.recurrence : 'none',
        tags: normalizeStringArray(todo.tags),
        links: normalizeStringArray(todo.links),
        subtasks: normalizeSubtasks(todo.subtasks),
        attachments: normalizeAttachments(todo.attachments),
        order: typeof todo.order === 'number' && Number.isFinite(todo.order) ? todo.order : index,
        archived: Boolean(todo.archived),
        archivedAt: typeof todo.archivedAt === 'string' ? todo.archivedAt : null
      };
    })
  };
}

function migrateV2ToV3(raw: unknown): Workspace {
  const source = asRecord(raw);
  const timestamp = nowIso();
  const graph = asRecord(source.graph);
  const graphNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const seeded = migrateV1ToV2(raw);

  return {
    ...seeded,
    schemaVersion: 3,
    graph: {
      nodes: graphNodes.map((nodeValue: unknown) => {
        const node = asRecord(nodeValue);
        return {
          ...createNode(typeof node.label === 'string' ? node.label : 'Node'),
          ...node,
          x: typeof node.x === 'number' && Number.isFinite(node.x) ? node.x : 0,
          y: typeof node.y === 'number' && Number.isFinite(node.y) ? node.y : 0,
          updatedAt: typeof node.updatedAt === 'string' ? node.updatedAt : timestamp,
          createdAt: typeof node.createdAt === 'string' ? node.createdAt : timestamp
        };
      }),
      edges: graphEdges.map((edgeValue: unknown) => {
        const edge = asRecord(edgeValue);
        const from =
          typeof edge.from === 'string'
            ? edge.from
            : typeof edge.source === 'string'
              ? edge.source
              : '';
        const to =
          typeof edge.to === 'string'
            ? edge.to
            : typeof edge.target === 'string'
              ? edge.target
              : '';

        return {
          ...createEdge(from, to),
          ...edge,
          from,
          to,
          type: normalizeEdgeType(edge.type),
          updatedAt: typeof edge.updatedAt === 'string' ? edge.updatedAt : timestamp,
          createdAt: typeof edge.createdAt === 'string' ? edge.createdAt : timestamp
        };
      })
    }
  };
}

export function migrateWorkspace(rawWorkspace: unknown): Workspace {
  if (!isRecord(rawWorkspace)) {
    return createWorkspace();
  }

  let nextWorkspace = migrateV0ToV1(rawWorkspace);
  nextWorkspace = migrateV1ToV2(nextWorkspace);
  nextWorkspace = migrateV2ToV3(nextWorkspace);

  return {
    ...nextWorkspace,
    schemaVersion: CURRENT_SCHEMA_VERSION
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry: unknown) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function normalizeSubtasks(value: unknown): Subtask[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry: unknown) => isRecord(entry))
    .map((entry: unknown) => {
      const record = asRecord(entry);
      return {
        id: typeof record.id === 'string' ? record.id : makeId('subtask'),
        text:
          typeof record.text === 'string' && record.text.trim()
            ? record.text.trim()
            : 'Untitled subtask',
        completed: Boolean(record.completed)
      };
    });
}

function normalizeAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry: unknown) => isRecord(entry))
    .map((entry: unknown) => {
      const record = asRecord(entry);
      return {
        id: typeof record.id === 'string' ? record.id : makeId('attachment'),
        name: typeof record.name === 'string' ? record.name : 'attachment',
        type: typeof record.type === 'string' ? record.type : 'application/octet-stream',
        size: typeof record.size === 'number' && Number.isFinite(record.size) ? record.size : 0,
        previewUrl: typeof record.previewUrl === 'string' ? record.previewUrl : null
      };
    });
}

function normalizeNodeShape(value: unknown): NodeShape {
  if (value === 'circle' || value === 'square' || value === 'diamond' || value === 'pill') {
    return value;
  }
  return 'square';
}

function normalizeNodeSize(value: unknown): NodeSize {
  if (value === 'sm' || value === 'md' || value === 'lg') {
    return value;
  }
  return 'md';
}

function normalizeEdgeType(value: unknown): EdgeType {
  if (value === 'curved' || value === 'straight' || value === 'orthogonal') {
    return value;
  }
  return 'curved';
}

export function validateWorkspace(workspace: unknown): ValidationResult {
  const errors: string[] = [];
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
  const safeWorkspace: Workspace = {
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
      .filter((list: List) => typeof list.name === 'string')
      .map((list: List, index: number) => ({
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

  const validListIds: Set<string> = new Set(safeWorkspace.lists.map((list: List) => list.id));

  if (!Array.isArray(migrated.todos)) {
    errors.push('Todos must be an array.');
    safeWorkspace.todos = [];
  } else {
    safeWorkspace.todos = migrated.todos
      .filter((todo: Todo) => typeof todo.text === 'string')
      .map((todo: Todo, index: number) => {
        const resolvedListId = validListIds.has(todo.listId)
          ? todo.listId
          : safeWorkspace.lists[0].id;

        return {
          id: typeof todo.id === 'string' ? todo.id : makeId('todo'),
          listId: resolvedListId,
          text: todo.text.trim() || 'Untitled task',
          completed: Boolean(todo.completed),
          priority: isPriority(todo.priority) ? todo.priority : 'medium',
          tags: normalizeStringArray(todo.tags),
          dueDate: typeof todo.dueDate === 'string' && todo.dueDate.trim() ? todo.dueDate : null,
          recurrence: isRecurrence(todo.recurrence) ? todo.recurrence : 'none',
          description: typeof todo.description === 'string' ? todo.description : '',
          subtasks: normalizeSubtasks(todo.subtasks),
          status: isStatus(todo.status) ? todo.status : 'todo',
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

  const validListIdsAfterValidation: Set<string> = new Set(safeWorkspace.lists.map((list: List) => list.id));
  if (!validListIdsAfterValidation.has(safeWorkspace.preferences.activeListId)) {
    safeWorkspace.preferences.activeListId = safeWorkspace.lists[0].id;
  }

  safeWorkspace.graph.nodes = safeWorkspace.graph.nodes
    .filter((node: GraphNode) => Boolean(node))
    .map((node: GraphNode) => ({
      id: typeof node.id === 'string' ? node.id : makeId('node'),
      label: typeof node.label === 'string' ? node.label : 'Node',
      description: typeof node.description === 'string' ? node.description : '',
      tags: normalizeStringArray(node.tags),
      priority: isPriority(node.priority) ? node.priority : 'medium',
      status: isStatus(node.status) ? node.status : 'todo',
      completed: Boolean(node.completed),
      icon: typeof node.icon === 'string' && node.icon.trim() ? node.icon.trim().slice(0, 2) : '◉',
      shape: normalizeNodeShape(node.shape),
      size: normalizeNodeSize(node.size),
      color: typeof node.color === 'string' && node.color.trim() ? node.color.trim() : '#b08968',
      textColor: typeof node.textColor === 'string' && node.textColor.trim() ? node.textColor.trim() : '#2e241f',
      borderColor: typeof node.borderColor === 'string' && node.borderColor.trim() ? node.borderColor.trim() : '#8a6042',
      shadow: Boolean(node.shadow ?? true),
      opacity: Number.isFinite(node.opacity) ? Math.max(0.15, Math.min(1, Number(node.opacity))) : 1,
      alias: typeof node.alias === 'string' ? node.alias : '',
      todoId: typeof node.todoId === 'string' && node.todoId.trim() ? node.todoId : null,
      owner: typeof node.owner === 'string' ? node.owner : '',
      collapsed: Boolean(node.collapsed),
      estimateMinutes:
        typeof node.estimateMinutes === 'number' && Number.isFinite(node.estimateMinutes)
          ? node.estimateMinutes
          : null,
      x: Number.isFinite(node.x) ? Number(node.x) : 0,
      y: Number.isFinite(node.y) ? Number(node.y) : 0,
      createdAt: typeof node.createdAt === 'string' ? node.createdAt : nowIso(),
      updatedAt: typeof node.updatedAt === 'string' ? node.updatedAt : nowIso()
    }));

  const validNodeIds: Set<string> = new Set(safeWorkspace.graph.nodes.map((node: GraphNode) => node.id));

  safeWorkspace.graph.edges = safeWorkspace.graph.edges
    .filter((edge: GraphEdge) => Boolean(edge))
    .map((edge: GraphEdge) => ({
      id: typeof edge.id === 'string' ? edge.id : makeId('edge'),
      from: typeof edge.from === 'string' ? edge.from : '',
      to: typeof edge.to === 'string' ? edge.to : '',
      type: normalizeEdgeType(edge.type),
      createdAt: typeof edge.createdAt === 'string' ? edge.createdAt : nowIso(),
      updatedAt: typeof edge.updatedAt === 'string' ? edge.updatedAt : nowIso()
    }))
    .filter((edge: GraphEdge) => validNodeIds.has(edge.from) && validNodeIds.has(edge.to));

  if (safeWorkspace.todos.length > 0 && safeWorkspace.todos.some((todo: Todo) => todo.text.length === 0)) {
    errors.push('One or more todos had empty text and were repaired.');
  }

  safeWorkspace.meta.updatedAt = nowIso();
  return {
    valid: errors.length === 0,
    errors,
    workspace: safeWorkspace
  };
}

function safeParseJson(rawText: unknown): unknown {
  try {
    return JSON.parse(typeof rawText === 'string' ? rawText : '');
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

export function loadWorkspaceFromStorage(): LoadResult {
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

export function saveWorkspaceToStorage(workspace: Workspace): void {
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

  Object.values(STORAGE_KEYS).forEach((key: string) => {
    storage.removeItem(key);
  });
}

export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify(workspace, null, 2);
}

export function deserializeWorkspace(rawText: string): { workspace: Workspace; warnings: string[] } {
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

export function createBackupSnapshot(workspace: Workspace): BackupSnapshot | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const backup: BackupSnapshot = {
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

export function readSettings(): Record<string, unknown> {
  const storage = getStorage();
  if (!storage) {
    return {};
  }
  const raw = storage.getItem(STORAGE_KEYS.settings);
  const parsed = raw ? safeParseJson(raw) : {};
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
}

export function writeSettings(nextSettings: Record<string, unknown>): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEYS.settings, JSON.stringify(nextSettings));
}

export function getRecentFiles(): RecentFile[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  const raw = storage.getItem(STORAGE_KEYS.recentFiles);
  const parsed = raw ? safeParseJson(raw) : [];
  return Array.isArray(parsed) ? (parsed as RecentFile[]) : [];
}

export function registerRecentFile(fileMeta: { name?: string; source?: FileSource }): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const now = nowIso();
  const current = getRecentFiles();
  const nextItem: RecentFile = {
    id: makeId('recent'),
    name: fileMeta?.name || 'Untitled workspace',
    source: fileMeta?.source || 'local',
    timestamp: now
  };

  const deduped = current.filter((entry: RecentFile) => entry.name !== nextItem.name);
  const next = [nextItem, ...deduped].slice(0, MAX_RECENT_FILES);
  storage.setItem(STORAGE_KEYS.recentFiles, JSON.stringify(next));
}

export function estimateStorageUsageBytes() {
  const storage = getStorage();
  if (!storage) {
    return 0;
  }

  let total = 0;
  Object.values(STORAGE_KEYS).forEach((key: string) => {
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

export async function openWorkspaceFromFile(file: File): Promise<{ workspace: Workspace; warnings: string[] }> {
  const content = await file.text();
  const { workspace, warnings } = deserializeWorkspace(content);
  registerRecentFile({ name: file.name, source: 'import' });
  return { workspace, warnings };
}

export function downloadWorkspaceFile(workspace: Workspace, fileName: string = 'workspace.todo.json'): void {
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

const pickerTypes: Array<{ description: string; accept: Record<string, string[]> }> = [
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

export async function openWorkspaceViaPicker(): Promise<{ workspace: Workspace; warnings: string[]; fileHandle: FileSystemFileHandle; fileName: string }> {
  if (!supportsFileSystemAccessApi()) {
    throw new Error('File System Access API is unavailable in this browser.');
  }

  const openPickerWindow = window as unknown as Window & {
    showOpenFilePicker: (options: unknown) => Promise<FileSystemFileHandle[]>;
  };

  const [fileHandle] = await openPickerWindow.showOpenFilePicker({
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

export async function saveWorkspaceWithHandle(workspace: Workspace, fileHandle: FileSystemFileHandle): Promise<void> {
  if (!fileHandle) {
    throw new Error('Missing file handle for save operation.');
  }

  const writable = await fileHandle.createWritable();
  await writable.write(serializeWorkspace(workspace));
  await writable.close();
}

export async function saveWorkspaceAsViaPicker(workspace: Workspace, suggestedName: string = 'workspace.todo.json'): Promise<{ fileHandle: FileSystemFileHandle; fileName: string }> {
  if (!supportsFileSystemAccessApi() || !('showSaveFilePicker' in window)) {
    throw new Error('File System Access API is unavailable in this browser.');
  }

  const fileHandle = await (window as Window & { showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
    suggestedName,
    types: pickerTypes
  });

  await saveWorkspaceWithHandle(workspace, fileHandle);
  registerRecentFile({ name: suggestedName, source: 'picker-save' });
  return { fileHandle, fileName: suggestedName };
}
