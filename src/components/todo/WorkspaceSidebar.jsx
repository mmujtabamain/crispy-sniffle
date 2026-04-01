import {
  ArrowDown,
  ArrowUp,
  Archive,
  Eraser,
  FileDown,
  FileImage,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FileUp,
  LoaderCircle,
  Printer,
  Save,
  Star,
  Trash2,
  Undo2,
  UploadCloud
} from 'lucide-react';
import { DEFAULT_EXPORT_FILE_STEM } from '../../lib/workspace-page-helpers';
import PanelSection from './PanelSection';

export default function WorkspaceSidebar({
  title,
  updatedAtLabel,
  lists,
  activeListId,
  showArchivedLists,
  onToggleShowArchivedLists,
  onCreateList,
  onSelectList,
  onRenameList,
  onDeleteList,
  onMoveList,
  onArchiveList,
  onRestoreList,
  busyAction,
  autosaveMinutes,
  backupsCount,
  recentFiles,
  formatRelativeDate,
  onOpen,
  onSave,
  onSaveAs,
  onAutosaveChange,
  onClearLocalData,
  importMode,
  onImportModeChange,
  onPickImportFiles,
  importPreviews,
  onApplyImports,
  onClearImportPreview,
  exportConfig,
  onExportConfigChange,
  onExportJson,
  onExportCsv,
  onExportMarkdown,
  onExportTxt,
  onExportPdf,
  onPrint,
  onExportImages
}) {
  const visibleLists = lists.filter((list) => (showArchivedLists ? true : !list.archived));

  return (
    <aside className="workspace-aside">
      <div className="panel">
        <div className="panel-headline-row">
          <h2>Lists</h2>
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              const name = window.prompt('New list name', 'New list');
              if (!name) {
                return;
              }
              const icon = window.prompt('List icon or emoji', '🗂️') || '🗂️';
              const color = window.prompt('List color (hex)', '#b08968') || '#b08968';
              onCreateList({ name, icon, color });
            }}
          >
            <FilePlus2 size={15} /> Add list
          </button>
        </div>

        <label className="inline-toggle">
          <input
            type="checkbox"
            checked={showArchivedLists}
            onChange={(event) => onToggleShowArchivedLists(event.target.checked)}
          />
          <span>Show archived lists</span>
        </label>

        <ul className="list-stack">
          {visibleLists.map((list, index) => (
            <li key={list.id} className={`list-row ${list.id === activeListId ? 'active' : ''}`}>
              <button type="button" className="list-select" onClick={() => onSelectList(list.id)}>
                <span className="list-icon" style={{ background: list.color }}>
                  {list.icon}
                </span>
                <span>
                  {list.name}
                  {list.archived && <small> archived</small>}
                </span>
              </button>
              <div className="list-actions">
                <button type="button" className="ghost-button" onClick={() => onMoveList(list.id, -1)} disabled={index === 0}>
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onMoveList(list.id, 1)}
                  disabled={index === visibleLists.length - 1}
                >
                  <ArrowDown size={14} />
                </button>
                <button type="button" className="ghost-button" onClick={() => onRenameList(list.id)}>
                  <Star size={14} />
                </button>
                {list.archived ? (
                  <button type="button" className="ghost-button" onClick={() => onRestoreList(list.id)}>
                    <Undo2 size={14} />
                  </button>
                ) : (
                  <button type="button" className="ghost-button" onClick={() => onArchiveList(list.id)}>
                    <Archive size={14} />
                  </button>
                )}
                <button type="button" className="ghost-button danger" onClick={() => onDeleteList(list.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <PanelSection title="Workspace">
        <p className="panel-copy">{title}</p>
        <p className="meta-line">Updated {updatedAtLabel}</p>
      </PanelSection>

      <PanelSection title="Persistence">
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
      </PanelSection>

      <PanelSection title="Auto-Backup">
        <label htmlFor="autosave-select" className="setting-label">
          Snapshot interval
        </label>
        <select id="autosave-select" value={autosaveMinutes} onChange={(event) => onAutosaveChange(Number(event.target.value))}>
          <option value={1}>1 minute</option>
          <option value={5}>5 minutes</option>
          <option value={10}>10 minutes</option>
        </select>
        <p className="meta-line">{backupsCount} local snapshots retained</p>
      </PanelSection>

      <PanelSection title="Import" className="dropzone-panel">
        <div className="button-stack">
          <button type="button" className="secondary-button" onClick={onPickImportFiles}>
            <UploadCloud size={16} /> Import files
          </button>
        </div>

        <label htmlFor="import-mode" className="setting-label">
          Import strategy
        </label>
        <select id="import-mode" value={importMode} onChange={(event) => onImportModeChange(event.target.value)}>
          <option value="merge">Merge imported todos</option>
          <option value="replace">Replace current list todos</option>
        </select>

        {importPreviews.length === 0 ? (
          <p className="meta-line">Drop JSON, CSV, Markdown, TXT, or OPML files to preview.</p>
        ) : (
          <>
            <ul className="recent-list import-preview-list">
              {importPreviews.map((preview) => (
                <li key={preview.id}>
                  <span>
                    {preview.fileName} <small>{preview.kind}</small>
                  </span>
                  <small>{preview.previewCount} items</small>
                </li>
              ))}
            </ul>
            <div className="button-stack inline-row">
              <button type="button" className="secondary-button" onClick={onApplyImports}>
                Apply import
              </button>
              <button type="button" className="secondary-button" onClick={onClearImportPreview}>
                Clear preview
              </button>
            </div>
          </>
        )}
      </PanelSection>

      <PanelSection title="Export">
        <label htmlFor="export-scope" className="setting-label">
          Scope
        </label>
        <select
          id="export-scope"
          value={exportConfig.scope}
          onChange={(event) => onExportConfigChange('scope', event.target.value)}
        >
          <option value="list">Current list</option>
          <option value="all">All lists</option>
          <option value="selected">Selected todos</option>
        </select>

        <label htmlFor="export-filename" className="setting-label">
          Filename stem
        </label>
        <input
          id="export-filename"
          value={exportConfig.fileName}
          onChange={(event) => onExportConfigChange('fileName', event.target.value)}
          placeholder={DEFAULT_EXPORT_FILE_STEM}
        />

        <div className="button-stack export-grid">
          <button type="button" className="secondary-button" onClick={onExportJson}>
            <FileDown size={15} /> JSON
          </button>
          <button type="button" className="secondary-button" onClick={onExportCsv}>
            <FileSpreadsheet size={15} /> CSV
          </button>
          <button type="button" className="secondary-button" onClick={onExportMarkdown}>
            <FileText size={15} /> Markdown
          </button>
          <button type="button" className="secondary-button" onClick={onExportTxt}>
            <FileText size={15} /> TXT
          </button>
        </div>

        <label htmlFor="pdf-header" className="setting-label">
          PDF header
        </label>
        <input
          id="pdf-header"
          value={exportConfig.pdfHeader}
          onChange={(event) => onExportConfigChange('pdfHeader', event.target.value)}
          placeholder="Sprint notes"
        />

        <label htmlFor="pdf-footer" className="setting-label">
          PDF footer
        </label>
        <input
          id="pdf-footer"
          value={exportConfig.pdfFooter}
          onChange={(event) => onExportConfigChange('pdfFooter', event.target.value)}
          placeholder="Confidential"
        />

        <div className="button-stack inline-row">
          <button type="button" className="secondary-button" onClick={onExportPdf}>
            <FileDown size={15} /> PDF
          </button>
          <button type="button" className="secondary-button" onClick={onPrint}>
            <Printer size={15} /> Print
          </button>
        </div>

        <div className="inspector-row two compact">
          <label>
            Image mode
            <select
              value={exportConfig.imageMode}
              onChange={(event) => onExportConfigChange('imageMode', event.target.value)}
            >
              <option value="single">Single image</option>
              <option value="gallery">Gallery</option>
            </select>
          </label>
          <label>
            Format
            <select
              value={exportConfig.imageFormat}
              onChange={(event) => onExportConfigChange('imageFormat', event.target.value)}
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="both">PNG + JPG</option>
            </select>
          </label>
        </div>

        <div className="inspector-row two compact">
          <label>
            Width
            <input
              type="number"
              min={500}
              value={exportConfig.imageWidth}
              onChange={(event) => onExportConfigChange('imageWidth', Number(event.target.value) || 1400)}
            />
          </label>
          <label>
            Height
            <input
              type="number"
              min={500}
              value={exportConfig.imageHeight}
              onChange={(event) => onExportConfigChange('imageHeight', Number(event.target.value) || 1800)}
            />
          </label>
        </div>

        <div className="inspector-row two compact">
          <label>
            Font size
            <input
              type="number"
              min={14}
              value={exportConfig.imageFontSize}
              onChange={(event) => onExportConfigChange('imageFontSize', Number(event.target.value) || 28)}
            />
          </label>
          <label>
            Todos per image
            <input
              type="number"
              min={1}
              value={exportConfig.todosPerImage}
              onChange={(event) => onExportConfigChange('todosPerImage', Number(event.target.value) || 12)}
            />
          </label>
        </div>

        <label htmlFor="image-bg" className="setting-label">
          Image background
        </label>
        <input
          id="image-bg"
          value={exportConfig.imageBackground}
          onChange={(event) => onExportConfigChange('imageBackground', event.target.value)}
          placeholder="#f6efe9"
        />

        <button type="button" className="secondary-button" onClick={onExportImages}>
          <FileImage size={15} /> Export images
        </button>
      </PanelSection>

      <PanelSection title="Recent Files">
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
      </PanelSection>

      <PanelSection title="Danger Zone" className="danger-panel">
        <button type="button" className="danger-button" onClick={onClearLocalData}>
          <Eraser size={16} /> Clear local data
        </button>
      </PanelSection>
    </aside>
  );
}
