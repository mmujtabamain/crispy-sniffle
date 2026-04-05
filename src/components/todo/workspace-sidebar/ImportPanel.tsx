import { useState } from "react";
import { UploadCloud } from "lucide-react";
import type { ImportMode } from "../../../features/workspace/types";
import PanelSection from "../PanelSection";
import type { ImportPanelProps } from "./types";

export default function ImportPanel({
  importPreviews,
  onPickImportFiles,
  onApplyImports,
  onClearImportPreview,
}: ImportPanelProps) {
  const [importMode, setImportMode] = useState<ImportMode>("merge");

  return (
    <PanelSection title="Import" className="dropzone-panel">
      <div className="button-stack">
        <button
          type="button"
          className="secondary-button"
          onClick={onPickImportFiles}
        >
          <UploadCloud size={16} /> Import files
        </button>
      </div>

      <label htmlFor="import-mode" className="setting-label">
        Import strategy
      </label>
      <select
        id="import-mode"
        value={importMode}
        onChange={(event) => setImportMode(event.target.value as ImportMode)}
      >
        <option value="merge">Merge imported todos</option>
        <option value="replace">Replace current list todos</option>
      </select>

      {importPreviews.length === 0 ? (
        <p className="meta-line">
          Drop JSON, CSV, Markdown, TXT, or OPML files to preview.
        </p>
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
            <button
              type="button"
              className="secondary-button"
              onClick={() => onApplyImports(importMode)}
            >
              Apply import
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onClearImportPreview}
            >
              Clear preview
            </button>
          </div>
        </>
      )}
    </PanelSection>
  );
}
