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
  const nextActiveListId =
    typeof settings.activeListId === "string" && settings.activeListId
      ? settings.activeListId
      : loaded.workspace.preferences.activeListId || loaded.workspace.lists[0]?.id;

  const patchedWorkspace: Workspace = {
    ...loaded.workspace,
    preferences: {
      ...loaded.workspace.preferences,
      theme: nextTheme,
      autosaveMinutes: nextAutosaveMinutes,
      activeListId: nextActiveListId,
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
