import {
  GraphWorkspace,
  ToastShelf,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceSidebar,
} from "../components/todo";
import { useWorkspacePageController } from "../features/workspace/useWorkspacePageController";

export default function WorkspacePage() {
  const {
    viewMode,
    openInputRef,
    importInputRef,
    onOpenInputChange,
    onImportInputChange,
    onDropFiles,
    toastShelfProps,
    headerProps,
    sidebarProps,
    graphProps,
    mainProps,
  } = useWorkspacePageController();

  return (
    <section
      className="workspace-shell"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const files = event.dataTransfer?.files ? [...event.dataTransfer.files] : [];
        onDropFiles(files);
      }}
    >
      <input
        ref={openInputRef}
        type="file"
        accept=".json,.todo,.csv,application/json,text/csv"
        hidden
        onChange={onOpenInputChange}
      />

      <input
        ref={importInputRef}
        type="file"
        accept=".json,.todo,.csv,.md,.markdown,.txt,.opml"
        hidden
        multiple
        onChange={onImportInputChange}
      />

      <ToastShelf {...toastShelfProps} />
      <WorkspaceHeader {...headerProps} />

      <div className="workspace-grid">
        <WorkspaceSidebar {...sidebarProps} />
        {viewMode === "graph" ? (
          <GraphWorkspace {...graphProps} />
        ) : (
          <WorkspaceMain {...mainProps} />
        )}
      </div>
    </section>
  );
}
