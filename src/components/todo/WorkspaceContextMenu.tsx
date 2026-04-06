import type {
  ContextAction,
  ContextMenuState,
} from "../../features/workspace/types";

export interface WorkspaceContextMenuProps {
  menu: ContextMenuState | null;
  onAction: (action: ContextAction, todoId: string) => void;
}

export default function WorkspaceContextMenu({
  menu,
  onAction,
}: WorkspaceContextMenuProps) {
  if (!menu) {
    return null;
  }

  return (
    <div
      className="fixed z-[100] bg-[var(--surface)] border border-[color-mix(in_oklch,var(--line),transparent_20%)] shadow-[var(--shadow)] rounded-[0.7rem] p-1 min-w-[160px] grid"
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        type="button"
        className="border-none bg-transparent text-left px-2 py-2 rounded-[0.4rem] cursor-pointer hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_35%)]"
        onClick={() => onAction("select", menu.todoId)}
      >
        Select / Unselect
      </button>
      <button
        type="button"
        className="border-none bg-transparent text-left px-2 py-2 rounded-[0.4rem] cursor-pointer hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_35%)]"
        onClick={() => onAction("duplicate", menu.todoId)}
      >
        Duplicate
      </button>
      <button
        type="button"
        className="border-none bg-transparent text-left px-2 py-2 rounded-[0.4rem] cursor-pointer hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_35%)]"
        onClick={() => onAction("archive", menu.todoId)}
      >
        Archive
      </button>
      <button
        type="button"
        className="border-none bg-transparent text-left px-2 py-2 rounded-[0.4rem] cursor-pointer hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_35%)]"
        onClick={() => onAction("restore", menu.todoId)}
      >
        Restore
      </button>
      <button
        type="button"
        className="border-none bg-transparent text-left px-2 py-2 rounded-[0.4rem] cursor-pointer hover:bg-[color-mix(in_oklch,var(--surface),var(--accent-soft)_35%)]"
        onClick={() => onAction("delete", menu.todoId)}
      >
        Delete
      </button>
    </div>
  );
}
