import { Moon, Redo2, Sun, Undo2 } from 'lucide-react';

interface WorkspaceHeaderProps {
  theme: 'light' | 'dark';
  undoCount: number;
  redoCount: number;
  viewMode: 'list' | 'graph';
  onThemeToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onViewModeChange: (mode: 'list' | 'graph') => void;
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
  totalListTodos
}: WorkspaceHeaderProps) {
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
        <div className="view-switch" role="group" aria-label="Workspace view">
          <button
            type="button"
            className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            aria-pressed={viewMode === 'list'}
          >
            List View
          </button>
          <button
            type="button"
            className={`view-toggle-button ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => onViewModeChange('graph')}
            aria-pressed={viewMode === 'graph'}
          >
            Graph View
          </button>
        </div>
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
