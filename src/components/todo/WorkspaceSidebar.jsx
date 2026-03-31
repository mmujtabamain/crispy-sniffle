import { Eraser, FileDown, FileUp, LoaderCircle, Save } from 'lucide-react';

export default function WorkspaceSidebar({
  title,
  updatedAtLabel,
  busyAction,
  autosaveMinutes,
  backupsCount,
  recentFiles,
  formatRelativeDate,
  onOpen,
  onSave,
  onSaveAs,
  onAutosaveChange,
  onClearLocalData
}) {
  return (
    <aside className="workspace-aside">
      <div className="panel">
        <h2>Workspace</h2>
        <p className="panel-copy">{title}</p>
        <p className="meta-line">Updated {updatedAtLabel}</p>
      </div>

      <div className="panel">
        <h2>Persistence</h2>
        <div className="button-stack">
          <button type="button" className="secondary-button" onClick={() => void onOpen()}>
            {busyAction === 'open' ? <LoaderCircle size={16} className="spin" /> : <FileUp size={16} />} Open
          </button>
          <button type="button" className="secondary-button" onClick={() => void onSave()}>
            {busyAction === 'save' ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />} Save
          </button>
          <button type="button" className="secondary-button" onClick={() => void onSaveAs()}>
            {busyAction === 'saveAs' ? <LoaderCircle size={16} className="spin" /> : <FileDown size={16} />} Save As
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Auto-Backup</h2>
        <label htmlFor="autosave-select" className="setting-label">
          Snapshot interval
        </label>
        <select id="autosave-select" value={autosaveMinutes} onChange={(event) => onAutosaveChange(Number(event.target.value))}>
          <option value={1}>1 minute</option>
          <option value={5}>5 minutes</option>
          <option value={10}>10 minutes</option>
        </select>
        <p className="meta-line">{backupsCount} local snapshots retained</p>
      </div>

      <div className="panel">
        <h2>Recent Files</h2>
        {recentFiles.length === 0 ? (
          <p className="meta-line">No recent files yet.</p>
        ) : (
          <ul className="recent-list">
            {recentFiles.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <span>{entry.name}</span>
                <small>{formatRelativeDate(entry.timestamp)}</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel danger-panel">
        <h2>Danger Zone</h2>
        <button type="button" className="danger-button" onClick={onClearLocalData}>
          <Eraser size={16} /> Clear local data
        </button>
      </div>
    </aside>
  );
}
