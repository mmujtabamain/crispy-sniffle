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
    <div className="context-menu" style={{ left: menu.x, top: menu.y }}>
      <button type="button" onClick={() => onAction("select", menu.todoId)}>
        Select / Unselect
      </button>
      <button type="button" onClick={() => onAction("duplicate", menu.todoId)}>
        Duplicate
      </button>
      <button type="button" onClick={() => onAction("archive", menu.todoId)}>
        Archive
      </button>
      <button type="button" onClick={() => onAction("restore", menu.todoId)}>
        Restore
      </button>
      <button type="button" onClick={() => onAction("delete", menu.todoId)}>
        Delete
      </button>
    </div>
  );
}
