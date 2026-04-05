import AutoBackupPanel from "./workspace-sidebar/AutoBackupPanel";
import DangerZonePanel from "./workspace-sidebar/DangerZonePanel";
import ExportPanel from "./workspace-sidebar/ExportPanel";
import ImportPanel from "./workspace-sidebar/ImportPanel";
import ListsPanel from "./workspace-sidebar/ListsPanel";
import PersistencePanel from "./workspace-sidebar/PersistencePanel";
import RecentFilesPanel from "./workspace-sidebar/RecentFilesPanel";
import WorkspaceSummaryPanel from "./workspace-sidebar/WorkspaceSummaryPanel";
import type { WorkspaceSidebarProps } from "./workspace-sidebar/types";

export type { WorkspaceSidebarProps } from "./workspace-sidebar/types";

export default function WorkspaceSidebar({
  listsPanel,
  workspaceSummary,
  persistencePanel,
  autoBackupPanel,
  importPanel,
  exportPanel,
  recentFilesPanel,
  dangerZonePanel,
}: WorkspaceSidebarProps) {
  return (
    <aside className="grid gap-2 sticky top-3">
      <ListsPanel {...listsPanel} />
      <WorkspaceSummaryPanel {...workspaceSummary} />
      <PersistencePanel {...persistencePanel} />
      <AutoBackupPanel {...autoBackupPanel} />
      <ImportPanel {...importPanel} />
      <ExportPanel {...exportPanel} />
      <RecentFilesPanel {...recentFilesPanel} />
      <DangerZonePanel {...dangerZonePanel} />
    </aside>
  );
}
