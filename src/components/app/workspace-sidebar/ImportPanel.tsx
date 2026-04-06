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
    <PanelSection title="Import">
      <div className="grid gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onPickImportFiles}
        >
          <UploadCloud size={16} /> Import files
        </button>
      </div>

      <label htmlFor="import-mode" className="text-xs text-[var(--ink-soft)]">
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
        <p className="text-sm text-[var(--ink-1)]">
          Drop JSON, CSV, Markdown, or TXT files to preview.
        </p>
      ) : (
        <>
          <ul className="grid gap-2 list-none">
            {importPreviews.map((preview) => (
              <li key={preview.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    {preview.fileName}{" "}
                    <small className="text-[0.62rem] uppercase tracking-[0.05em]">
                      {preview.kind}
                    </small>
                  </span>
                  <small className="text-[var(--ink-soft)]">
                    {preview.previewCount} items
                  </small>
                </div>
              </li>
            ))}
          </ul>
          <div className="grid flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
              onClick={() => onApplyImports(importMode)}
            >
              Apply import
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
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
