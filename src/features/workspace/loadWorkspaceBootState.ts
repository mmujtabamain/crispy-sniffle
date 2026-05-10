import {
  getRecentFiles,
  getStorageQuotaStatus,
  listBackups,
  loadWorkspaceFromStorage,
  readSettings,
  validateWorkspace,
} from "../../lib/workspace";
import type { Workspace } from "../../lib/workspace";
import type { WorkspaceBootState, SavedFilterPreset } from "./types";

export function loadWorkspaceBootState(): WorkspaceBootState {
  const loaded = loadWorkspaceFromStorage();
  const settings = readSettings();

  const nextTheme =
    settings.theme === "light" || settings.theme === "dark"
      ? settings.theme
      : loaded.workspace.preferences.theme;
  const nextAutosaveMinutes =
    typeof settings.autosaveMinutes === "number" &&
    Number.isFinite(settings.autosaveMinutes)
      ? settings.autosaveMinutes
      : loaded.workspace.preferences.autosaveMinutes;

  const patchedWorkspace: Workspace = {
    ...loaded.workspace,
    preferences: {
      ...loaded.workspace.preferences,
      theme: nextTheme,
      autosaveMinutes: nextAutosaveMinutes,
    },
  };

  const validated = validateWorkspace(patchedWorkspace).workspace;

  return {
    ...loaded,
    workspace: validated,
    savedFilters: Array.isArray(settings.savedFilters)
      ? (settings.savedFilters as SavedFilterPreset[])
      : [],
    recentFiles: getRecentFiles(),
    backups: listBackups(),
    quotaStatus: getStorageQuotaStatus(),
  };
}
