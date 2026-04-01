# Todo UI Extraction

Shared Tier 1 todo UI building blocks.

## Components

- `WorkspaceHeader`: Brand/title row with theme toggle + undo/redo controls.
- `WorkspaceSidebar`: Workspace metadata and local file operation controls.
- `WorkspaceMain`: Composer, counters, list actions, sortable todo list, and shortcuts.
- `SortableTodoItem`: Reusable draggable editable todo row.
- `ToastShelf`: Animated status notification stack.

## Usage Notes

- Keep state and side effects in the page container (`WorkspacePage`) and pass handlers to these components.
- Reuse existing CSS tokens and utility classes from `src/styles/tokens.css`.
- Prefer semantic props (`onSaveAs`, `updatedAtLabel`) over passing raw workspace objects.
