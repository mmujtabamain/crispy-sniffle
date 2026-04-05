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
      <label htmlFor="export-scope" className="text-xs text-[var(--ink-soft)]">
        Scope
      </label>
      <select
        id="export-scope"
        value={exportConfig.scope}
        onChange={(event) => onExportConfigChange("scope", event.target.value)}
      >
        <option value="list">Current list</option>
        <option value="all">All lists</option>
        <option value="selected">Selected todos</option>
      </select>

      <label htmlFor="export-filename" className="text-xs text-[var(--ink-soft)]">
        Filename stem
      </label>
      <input
        id="export-filename"
        value={exportConfig.fileName}
        onChange={(event) =>
          onExportConfigChange("fileName", event.target.value)
        }
        placeholder={DEFAULT_EXPORT_FILE_STEM}
      />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onExportJson}>
          <FileDown size={15} /> JSON
        </button>
        <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onExportCsv}>
          <FileSpreadsheet size={15} /> CSV
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onExportMarkdown}
        >
          <FileText size={15} /> Markdown
        </button>
        <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onExportTxt}>
          <FileText size={15} /> TXT
        </button>
      </div>

      <label htmlFor="pdf-header" className="text-xs text-[var(--ink-soft)]">
        PDF header
      </label>
      <input
        id="pdf-header"
        value={exportConfig.pdfHeader}
        onChange={(event) =>
          onExportConfigChange("pdfHeader", event.target.value)
        }
        placeholder="Sprint notes"
      />

      <label htmlFor="pdf-footer" className="setting-label">
        PDF footer
      </label>
      <input
        id="pdf-footer"
        value={exportConfig.pdfFooter}
        onChange={(event) =>
          onExportConfigChange("pdfFooter", event.target.value)
        }
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
            onChange={(event) =>
              onExportConfigChange("imageMode", event.target.value)
            }
          >
            <option value="single">Single image</option>
            <option value="gallery">Gallery</option>
          </select>
        </label>
        <label>
          Format
          <select
            value={exportConfig.imageFormat}
            onChange={(event) =>
              onExportConfigChange("imageFormat", event.target.value)
            }
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
            onChange={(event) =>
              onExportConfigChange(
                "imageWidth",
                Number(event.target.value) || 1400,
              )
            }
          />
        </label>
        <label>
          Height
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

      <div className="inspector-row two compact">
        <label>
          Font size
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
        <label>
          Todos per image
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

      <label htmlFor="image-bg" className="setting-label">
        Image background
      </label>
      <input
        id="image-bg"
        value={exportConfig.imageBackground}
        onChange={(event) =>
          onExportConfigChange("imageBackground", event.target.value)
        }
        placeholder="#f6efe9"
      />

      <button
        type="button"
        className="secondary-button"
        onClick={onExportImages}
      >
        <FileImage size={15} /> Export images
      </button>
    </PanelSection>
  );
}
