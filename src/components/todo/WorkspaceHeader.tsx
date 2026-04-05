import { Moon, Redo2, Sun, Undo2 } from "lucide-react";

export interface WorkspaceHeaderProps {
  theme: "light" | "dark";
  undoCount: number;
  redoCount: number;
  viewMode: "list" | "graph";
  onThemeToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onViewModeChange: (mode: "list" | "graph") => void;
  activeListName: string;
  visibleTodoCount: number;
  totalListTodos: number;
}

export default function WorkspaceHeader({
  theme,
  undoCount,
  redoCount,
  viewMode,
  onThemeToggle,
  onUndo,
  onRedo,
  onViewModeChange,
  activeListName,
  visibleTodoCount,
  totalListTodos,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex justify-between items-start gap-4 border-b border-[color-mix(in_oklch,var(--line),transparent_20%)] pb-3">
      <div className="max-w-[80ch]">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--ink-soft)]">Multi List Planner</p>
        <h1 className="mt-1 text-[clamp(1.7rem,2.8vw,3rem)] leading-[1.2] tracking-[-0.02em] [text-wrap:balance]">TaskScape</h1>
        <p className="mt-2 text-[var(--ink-1)] max-w-[72ch]">
          Active list: <strong>{activeListName || "Untitled list"}</strong> ·
          Showing {visibleTodoCount} of {totalListTodos} todos
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1 border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-3xl bg-[color-mix(in_oklch,var(--surface),white_8%)] p-1" role="group" aria-label="Workspace view">
          <button
            type="button"
            className={`border-none bg-transparent rounded-[0.58rem] min-h-[1.95rem] px-2.5 text-xs text-[var(--ink-soft)] cursor-pointer transition-colors ${viewMode === "list" ? "bg-[color-mix(in_oklch,var(--accent-soft)_58%,var(--surface))] text-[var(--ink-0)]" : "hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_32%)] hover:text-[var(--ink-1)]"}`}
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
          >
            List View
          </button>
          <button
            type="button"
            className={`border-none bg-transparent rounded-[0.58rem] min-h-[1.95rem] px-2.5 text-xs text-[var(--ink-soft)] cursor-pointer transition-colors ${viewMode === "graph" ? "bg-[color-mix(in_oklch,var(--accent-soft)_58%,var(--surface))] text-[var(--ink-0)]" : "hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_32%)] hover:text-[var(--ink-1)]"}`}
            onClick={() => onViewModeChange("graph")}
            aria-pressed={viewMode === "graph"}
          >
            Graph View
          </button>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 min-h-[2.35rem] min-w-[2.35rem] border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[var(--surface)] rounded-[0.72rem] cursor-pointer transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_34%)] active:translate-y-0"
          onClick={onThemeToggle}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 min-h-[2.35rem] min-w-[2.35rem] border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[var(--surface)] rounded-[0.72rem] px-2 cursor-pointer transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_34%)] active:translate-y-0"
          onClick={onUndo}
          aria-label="Undo"
        >
          <Undo2 size={18} />
          <span>{undoCount}</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 min-h-[2.35rem] min-w-[2.35rem] border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[var(--surface)] rounded-[0.72rem] px-2 cursor-pointer transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_34%)] active:translate-y-0"
          onClick={onRedo}
          aria-label="Redo"
        >
          <Redo2 size={18} />
          <span>{redoCount}</span>
        </button>
      </div>
    </header>
  );
}
