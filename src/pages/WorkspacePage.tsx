import {
  ToastShelf,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceSidebar,
} from "../components/app";
import TodoInspector from "../components/app/TodoInspector";
import { useWorkspacePageController } from "../features/workspace/useWorkspacePageController";
import { X } from "lucide-react";

export default function WorkspacePage() {
  const {
    openInputRef,
    importInputRef,
    onOpenInputChange,
    onImportInputChange,
    onDropFiles,
    toastShelfProps,
    headerProps,
    sidebarProps,
    mainProps,
  } = useWorkspacePageController();

  const inspector = mainProps.inspector;

  return (
    <section
      className="flex w-screen h-screen"
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
        accept=".json,.todo,.csv,.md,.markdown,.txt"
        hidden
        multiple
        onChange={onImportInputChange}
      />

      <ToastShelf {...toastShelfProps} />

      <div className="flex flex-row w-screen h-screen">
        <WorkspaceSidebar {...sidebarProps} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <WorkspaceHeader {...headerProps} />
          <WorkspaceMain {...mainProps} />
        </div>

        {/* Right inspector sidebar — visible when a todo is focused */}
        <aside
          className={`flex flex-col border-l border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_12%)] shadow-[-2px_0_8px_color-mix(in_oklch,var(--ink-0)_4%,transparent)] backdrop-blur-xl transition-[width,opacity] duration-300 ease-out overflow-hidden ${
            inspector.todo
              ? "w-[20rem] opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          {inspector.todo ? (
            <div className="flex flex-col h-full w-[20rem]">
              {/* Inspector header */}
              <div className="flex items-center justify-between gap-2 border-b border-[color-mix(in_oklch,var(--line),transparent_20%)] px-4 py-3 shrink-0">
                <div className="grid min-w-0">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
                    Selected
                  </span>
                  <span className="truncate text-sm font-semibold leading-tight">
                    Todo Details
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),white_18%)] active:translate-y-0"
                  onClick={() => mainProps.todoList.onFocusTodo(null)}
                  aria-label="Close inspector"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Inspector body — scrollable */}
              <div className="flex-1 overflow-y-auto p-3">
                <TodoInspector {...inspector} />
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
