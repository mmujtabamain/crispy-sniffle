import {
  FileDown,
  FileImage,
  FileSpreadsheet,
  FileText,
  Printer,
} from "lucide-react";
import { DEFAULT_EXPORT_FILE_STEM } from "../../../lib/workspace-page-helpers";
import PanelSection from "../PanelSection";
import type { ExportPanelProps } from "./types";

type ChipOption = { value: string; label: string };

function ChipGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ChipOption[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold transition-all ${
            value === opt.value
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "bg-[color-mix(in_oklch,var(--bg-1),transparent_30%)] text-[var(--ink-1)] border border-[color-mix(in_oklch,var(--line),transparent_30%)] hover:bg-[color-mix(in_oklch,var(--line),transparent_40%)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const SCOPE_OPTIONS: ChipOption[] = [
  { value: "list", label: "List" },
  { value: "all", label: "All" },
  { value: "selected", label: "Selected" },
];

const IMAGE_MODE_OPTIONS: ChipOption[] = [
  { value: "single", label: "Single" },
  { value: "gallery", label: "Gallery" },
];

const IMAGE_FORMAT_OPTIONS: ChipOption[] = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "both", label: "Both" },
];

export default function ExportPanel({
  exportConfig,
  onExportConfigChange,
  onExportJson,
  onExportCsv,
  onExportMarkdown,
  onExportTxt,
  onExportPdf,
  onPrint,
  onExportImages,
}: ExportPanelProps) {
  return (
    <PanelSection title="Export">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
        Scope
      </span>
      <ChipGroup
        value={exportConfig.scope}
        options={SCOPE_OPTIONS}
        onChange={(v) => onExportConfigChange("scope", v)}
      />

      <label className="grid gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
          Filename stem
        </span>
        <input
          value={exportConfig.fileName}
          onChange={(event) =>
            onExportConfigChange("fileName", event.target.value)
          }
          placeholder={DEFAULT_EXPORT_FILE_STEM}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onExportJson}
        >
          <FileDown size={15} /> JSON
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onExportCsv}
        >
          <FileSpreadsheet size={15} /> CSV
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onExportMarkdown}
        >
          <FileText size={15} /> Markdown
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onExportTxt}
        >
          <FileText size={15} /> TXT
        </button>
      </div>

      <label className="grid gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">PDF header</span>
        <input
          value={exportConfig.pdfHeader}
          onChange={(event) =>
            onExportConfigChange("pdfHeader", event.target.value)
          }
          placeholder="Sprint notes"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">PDF footer</span>
        <input
          value={exportConfig.pdfFooter}
          onChange={(event) =>
            onExportConfigChange("pdfFooter", event.target.value)
          }
          placeholder="Confidential"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onExportPdf}
        >
          <FileDown size={15} /> PDF
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onPrint}
        >
          <Printer size={15} /> Print
        </button>
      </div>

      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Image mode</span>
      <ChipGroup
        value={exportConfig.imageMode}
        options={IMAGE_MODE_OPTIONS}
        onChange={(v) => onExportConfigChange("imageMode", v)}
      />

      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Image format</span>
      <ChipGroup
        value={exportConfig.imageFormat}
        options={IMAGE_FORMAT_OPTIONS}
        onChange={(v) => onExportConfigChange("imageFormat", v)}
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Width</span>
          <input
            type="number"
            min={500}
            value={exportConfig.imageWidth}
            onChange={(event) =>
              onExportConfigChange(
                "imageWidth",
                Number(event.target.value) || 1400,
              )
            }
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Height</span>
          <input
            type="number"
            min={500}
            value={exportConfig.imageHeight}
            onChange={(event) =>
              onExportConfigChange(
                "imageHeight",
                Number(event.target.value) || 1800,
              )
            }
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Font size</span>
          <input
            type="number"
            min={14}
            value={exportConfig.imageFontSize}
            onChange={(event) =>
              onExportConfigChange(
                "imageFontSize",
                Number(event.target.value) || 28,
              )
            }
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Per image</span>
          <input
            type="number"
            min={1}
            value={exportConfig.todosPerImage}
            onChange={(event) =>
              onExportConfigChange(
                "todosPerImage",
                Number(event.target.value) || 12,
              )
            }
          />
        </label>
      </div>

      <label className="grid gap-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Image background</span>
        <input
          value={exportConfig.imageBackground}
          onChange={(event) =>
            onExportConfigChange("imageBackground", event.target.value)
          }
          placeholder="#f6efe9"
        />
      </label>

      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
        onClick={onExportImages}
      >
        <FileImage size={15} /> Export images
      </button>
    </PanelSection>
  );
}
