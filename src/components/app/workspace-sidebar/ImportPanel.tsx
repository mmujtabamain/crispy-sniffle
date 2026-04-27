import { useState } from "react";
import { UploadCloud } from "lucide-react";
import type { ImportMode } from "../../../features/workspace/types";
import PanelSection from "../PanelSection";
import type { ImportPanelProps } from "./types";

const MODE_OPTIONS: { value: ImportMode; label: string }[] = [
  { value: "merge", label: "Merge" },
  { value: "replace", label: "Replace" },
];

export default function ImportPanel({
  importPreviews,
  onPickImportFiles,
  onApplyImports,
  onClearImportPreview,
}: ImportPanelProps) {
  const [importMode, setImportMode] = useState<ImportMode>("merge");

  return (
    <PanelSection title="Import">
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onPickImportFiles}
      >
        <UploadCloud size={16} /> Import files
      </button>

      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
        Import strategy
      </span>
      <div className="flex flex-wrap gap-1.5">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setImportMode(opt.value)}
            className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold transition-all ${
              importMode === opt.value
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "bg-[color-mix(in_oklch,var(--bg-1),transparent_30%)] text-[var(--ink-1)] border border-[color-mix(in_oklch,var(--line),transparent_30%)] hover:bg-[color-mix(in_oklch,var(--line),transparent_40%)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

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
          <div className="grid gap-2">
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
