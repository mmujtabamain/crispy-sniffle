import { Moon, Redo2, Sun, Undo2 } from 'lucide-react';

export default function WorkspaceHeader({ theme, undoCount, redoCount, onThemeToggle, onUndo, onRedo }) {
  return (
    <header className="workspace-header">
      <div className="headline-wrap">
        <p className="kicker">Tier 1 Delivery</p>
        <h1 className="headline">Local-First Todo Atelier</h1>
        <p className="subhead">
          Fast single-workspace todos with versioned storage, drag-drop ordering, file export/import, and undo-safe editing.
        </p>
      </div>

      <div className="header-controls">
        <button type="button" className="icon-button" onClick={onThemeToggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" className="icon-button" onClick={onUndo} aria-label="Undo">
          <Undo2 size={18} />
          <span>{undoCount}</span>
        </button>
        <button type="button" className="icon-button" onClick={onRedo} aria-label="Redo">
          <Redo2 size={18} />
          <span>{redoCount}</span>
        </button>
      </div>
    </header>
  );
}
