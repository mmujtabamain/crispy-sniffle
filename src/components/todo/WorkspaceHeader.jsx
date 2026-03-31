import { Moon, Redo2, Sun, Undo2 } from 'lucide-react';

export default function WorkspaceHeader({
  theme,
  undoCount,
  redoCount,
  onThemeToggle,
  onUndo,
  onRedo,
  activeListName,
  visibleTodoCount,
  totalListTodos
}) {
  return (
    <header className="workspace-header">
      <div className="headline-wrap">
        <p className="kicker">Tier 2 Delivery</p>
        <h1 className="headline">Local-First Todo Atelier+</h1>
        <p className="subhead">
          Multi-list planning with advanced filters, rich task metadata, structured imports, and export pipelines.
        </p>
        <p className="header-meta-line">
          Active list: <strong>{activeListName || 'Untitled list'}</strong> · Showing {visibleTodoCount} of {totalListTodos} todos
        </p>
      </div>

      <div className="header-controls">
        <button type="button" className="icon-button" onClick={onThemeToggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" className="icon-button px-2" onClick={onUndo} aria-label="Undo">
          <Undo2 size={18} />
          <span>{undoCount}</span>
        </button>
        <button type="button" className="icon-button px-2" onClick={onRedo} aria-label="Redo">
          <Redo2 size={18} />
          <span>{redoCount}</span>
        </button>
      </div>
    </header>
  );
}
