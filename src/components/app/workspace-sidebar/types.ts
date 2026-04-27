import type {
  ExportConfig,
  ImportMode,
  ImportPreviewItem,
  RecentFileListItem,
} from "../../../features/workspace/types";

export interface WorkspaceRailProps {
  collapsed: boolean;
  propertiesOpen: boolean;
  activeListName: string;
  visibleTodoCount: number;
  totalTodoCount: number;
  onToggleCollapsed: () => void;
  onOpenProperties: () => void;
  onCloseProperties: () => void;
}

export interface WorkspaceSummaryPanelProps {
  title: string;
  updatedAtLabel: string;
}

export interface PersistencePanelProps {
  busyAction: string;
  fileName: string;
  onFileNameChange: (name: string) => void;
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
  rail: WorkspaceRailProps;
  workspaceSummary: WorkspaceSummaryPanelProps;
  persistencePanel: PersistencePanelProps;
  autoBackupPanel: AutoBackupPanelProps;
  importPanel: ImportPanelProps;
  exportPanel: ExportPanelProps;
  recentFilesPanel: RecentFilesPanelProps;
  dangerZonePanel: DangerZonePanelProps;
}
