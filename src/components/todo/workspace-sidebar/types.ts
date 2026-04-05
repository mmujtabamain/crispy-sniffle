import type { List } from "../../../lib/workspace";
import type {
  ExportConfig,
  ImportMode,
  ImportPreviewItem,
  RecentFileListItem,
} from "../../../features/workspace/types";

export interface ListsPanelProps {
  lists: List[];
  activeListId: string;
  onCreateList: (data: { name: string; icon: string; color: string }) => void;
  onSelectList: (listId: string) => void;
  onRenameList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onMoveList: (listId: string, direction: number) => void;
  onArchiveList: (listId: string) => void;
  onRestoreList: (listId: string) => void;
}

export interface WorkspaceSummaryPanelProps {
  title: string;
  updatedAtLabel: string;
}

export interface PersistencePanelProps {
  busyAction: string;
  onOpen: () => Promise<void> | void;
  onSave: () => Promise<void> | void;
  onSaveAs: () => Promise<void> | void;
}

export interface AutoBackupPanelProps {
  autosaveMinutes: number;
  backupsCount: number;
  onAutosaveChange: (minutes: number) => void;
}

export interface ImportPanelProps {
  importPreviews: ImportPreviewItem[];
  onPickImportFiles: () => void;
  onApplyImports: (mode: ImportMode) => void;
  onClearImportPreview: () => void;
}

export interface ExportPanelProps {
  exportConfig: ExportConfig;
  onExportConfigChange: (key: keyof ExportConfig, value: unknown) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportMarkdown: () => void;
  onExportTxt: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  onExportImages: () => void;
}

export interface RecentFilesPanelProps {
  recentFiles: RecentFileListItem[];
}

export interface DangerZonePanelProps {
  onClearLocalData: () => void;
}

export interface WorkspaceSidebarProps {
  listsPanel: ListsPanelProps;
  workspaceSummary: WorkspaceSummaryPanelProps;
  persistencePanel: PersistencePanelProps;
  autoBackupPanel: AutoBackupPanelProps;
  importPanel: ImportPanelProps;
  exportPanel: ExportPanelProps;
  recentFilesPanel: RecentFilesPanelProps;
  dangerZonePanel: DangerZonePanelProps;
}
