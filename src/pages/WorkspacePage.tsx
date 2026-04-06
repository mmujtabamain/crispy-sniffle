import {
  GraphWorkspace,
  ToastShelf,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceSidebar,
} from "../components/app";
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
      className="mx-auto grid gap-[clamp(0.8rem,1.8vw,1.4rem)] p-[clamp(1rem,2.8vw,2.2rem)] w-[min(1320px,100%-clamp(1rem,3vw,2.25rem))]"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const files = event.dataTransfer?.files
          ? [...event.dataTransfer.files]
          : [];
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

      <div className="grid grid-cols-[minmax(280px,360px)_1fr] items-start gap-[clamp(0.8rem,2vw,1.45rem)]">
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
