import type { TodoFilters } from "../../lib/todo-filters";
import type { ImportPreview } from "../../lib/todo-formats";
import type { Workspace } from "../../lib/workspace";

export type ImportMode = "merge" | "replace";
export type ContextAction =
  | "select"
  | "duplicate"
  | "archive"
  | "restore"
  | "delete";

export interface QuotaStatus {
  usedBytes: number;
  quotaBytes: number;
  warning: boolean;
}

export interface SavedFilterPreset {
  id: string;
  name: string;
  filters: TodoFilters;
}

export interface ToastItem {
  id: string;
  type: "success" | "error" | "warning" | "info" | string;
  message: string;
}

export interface ContextMenuState {
  todoId: string;
  x: number;
  y: number;
}

export interface ExportConfig {
  scope: "list" | "all" | "selected";
  fileName: string;
  pdfHeader: string;
  pdfFooter: string;
  imageMode: "single" | "gallery";
  imageFormat: "png" | "jpg" | "both";
  imageWidth: number;
  imageHeight: number;
  imageFontSize: number;
  todosPerImage: number;
  imageBackground: string;
}

export interface TimerState {
  todoId: string | null;
  running: boolean;
  remainingSec: number;
}

export interface CommitOptions {
  recordHistory?: boolean;
}

export type ImportPreviewItem = ImportPreview & { id: string };

export interface RecentFileItem {
  id: string;
  name: string;
  timestamp: string;
}

export interface RecentFileListItem {
  id: string;
  name: string;
  timestampLabel: string;
}

export interface WorkspaceBootState {
  workspace: Workspace;
  errors: string[];
  valid: boolean;
  source: "default" | "storage" | "repaired" | "fallback";
  savedFilters: SavedFilterPreset[];
  recentFiles: RecentFileItem[];
  backups: Array<unknown>;
  quotaStatus: QuotaStatus;
}

export const HISTORY_LIMIT = 150;
export const TOAST_LIFETIME_MS = 3400;
export const DEFAULT_FILE_NAME = "workspace.todo.json";

export function createDefaultExportConfig(): ExportConfig {
  return {
    scope: "list",
    fileName: "taskscape-export",
    pdfHeader: "",
    pdfFooter: "",
    imageMode: "single",
    imageFormat: "png",
    imageWidth: 1400,
    imageHeight: 1800,
    imageFontSize: 28,
    todosPerImage: 12,
    imageBackground: "#f6efe9",
  };
}
