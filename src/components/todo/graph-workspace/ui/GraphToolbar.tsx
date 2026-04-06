import {
  AlignCenterVertical,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  BringToFront,
  CopyPlus,
  FileDown,
  FileImage,
  FileJson,
  FileUp,
  Focus,
  Grid2x2,
  Link2,
  Maximize,
  Minimize,
  Network,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { EDGE_TYPES } from "../constants";
import { clamp } from "../utils";
import type { GraphToolbarProps } from "./types";

export default function GraphToolbar({
  importGraphRef,
  searchInputRef,
  defaultEdgeType,
  onDefaultEdgeTypeChange,
  onApplyEdgeType,
  gridSize,
  onGridSizeChange,
  snapToGrid,
  onSnapToGridChange,
  showMiniMap,
  onShowMiniMapChange,
  focusMode,
  onFocusModeChange,
  showCriticalPath,
  onShowCriticalPathChange,
  searchText,
  onSearchTextChange,
  onFindNext,
  exportName,
  onExportNameChange,
  exportScale,
  onExportScaleChange,
  transparentExport,
  onTransparentExportChange,
  exportBackground,
  onExportBackgroundChange,
  selectedNodeId,
  onAddNodeAtCenter,
  onDuplicateSelection,
  onDuplicateSubtree,
  onDeleteSelection,
  onSelectAll,
  onClearSelection,
  onToggleCollapse,
  onAlignSelected,
  onAutoLayout,
  onResetPositions,
  onSavePositions,
  onLoadPositions,
  onFitView,
  onResetView,
  onCenterOnSelected,
  onExportGraphJson,
  onExportSvg,
  onExportImage,
  onExportPdf,
  onPrintGraph,
  onClearGraph,
}: GraphToolbarProps) {
  return (
    <section className="grid gap-[0.55rem] rounded-2xl p-3 bg-[var(--surface)] border border-[color-mix(in_oklch,var(--line),transparent_20%)] shadow-[var(--shadow)]">
      <div className="flex justify-between items-center gap-[0.55rem] flex-wrap">
        <div className="flex gap-[0.35rem] flex-wrap items-center">
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onAddNodeAtCenter}
          >
            <Sparkles size={14} /> Add node
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onDuplicateSelection}
          >
            <CopyPlus size={14} /> Duplicate
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onDuplicateSubtree}
          >
            <Workflow size={14} /> Duplicate subtree
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-[color-mix(in_oklch,var(--error),var(--ink-0)_24%)] border border-[color-mix(in_oklch,var(--error)_50%,var(--line))] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onDeleteSelection}
          >
            <Trash2 size={14} /> Delete selected
          </button>
        </div>

        <div className="flex gap-[0.35rem] flex-wrap items-center">
          <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onSelectAll}>
            <BringToFront size={14} /> Select all
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onClearSelection}
          >
            <Minimize size={14} /> Deselect
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onToggleCollapse}
          >
            <Network size={14} /> Collapse/Expand branch
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-[0.55rem] flex-wrap">
        <div className="flex gap-[0.35rem] flex-wrap items-center">
          <label>
            Edge style
            <select
              value={defaultEdgeType}
              onChange={(event) =>
                onDefaultEdgeTypeChange(event.target.value as typeof defaultEdgeType)
              }
            >
              {EDGE_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onApplyEdgeType}
          >
            <Link2 size={14} /> Apply edge style
          </button>

          <label>
            Grid size
            <input
              type="number"
              min={8}
              max={120}
              value={gridSize}
              onChange={(event) =>
                onGridSizeChange(clamp(Number(event.target.value) || 28, 8, 120))
              }
            />
          </label>

          <label className="flex items-center gap-[0.45rem]">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(event) => onSnapToGridChange(event.target.checked)}
            />
            <span>Snap to grid</span>
          </label>

          <label className="flex items-center gap-[0.45rem]">
            <input
              type="checkbox"
              checked={showMiniMap}
              onChange={(event) => onShowMiniMapChange(event.target.checked)}
            />
            <span>Minimap</span>
          </label>

          <label className="flex items-center gap-[0.45rem]">
            <input
              type="checkbox"
              checked={focusMode}
              onChange={(event) => onFocusModeChange(event.target.checked)}
            />
            <span>Focus mode</span>
          </label>

          <label className="flex items-center gap-[0.45rem]">
            <input
              type="checkbox"
              checked={showCriticalPath}
              onChange={(event) => onShowCriticalPathChange(event.target.checked)}
            />
            <span>Critical path</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center gap-[0.55rem] flex-wrap">
        <div className="flex gap-[0.35rem] flex-wrap items-center">
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onAlignSelected("left")}
          >
            <AlignCenterVertical size={14} /> Align left
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onAlignSelected("right")}
          >
            <AlignCenterVertical size={14} /> Align right
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onAlignSelected("hcenter")}
          >
            <AlignHorizontalJustifyCenter size={14} /> Align center
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onAlignSelected("top")}
          >
            <AlignCenterVertical size={14} /> Align top
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onAlignSelected("bottom")}
          >
            <AlignCenterVertical size={14} /> Align bottom
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onAlignSelected("vcenter")}
          >
            <AlignVerticalJustifyCenter size={14} /> Align middle
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-[0.55rem] flex-wrap">
        <div className="flex gap-[0.35rem] flex-wrap items-center">
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onAutoLayout("hierarchical")}
          >
            <Workflow size={14} /> Auto-layout (hierarchy)
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onAutoLayout("force")}
          >
            <Sparkles size={14} /> Auto-layout (force)
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onResetPositions}
          >
            <Grid2x2 size={14} /> Reset positions
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onSavePositions}
          >
            <FileDown size={14} /> Save positions
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onLoadPositions}
          >
            <FileUp size={14} /> Load positions
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onFitView}
          >
            <Maximize size={14} /> Fit graph
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onResetView}
          >
            <RotateCcw size={14} /> Reset view
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onCenterOnSelected}
            disabled={!selectedNodeId}
          >
            <Focus size={14} /> Center on selected
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-[0.55rem] flex-wrap">
        <div className="inline-flex items-center gap-[0.35rem] border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-[0.7rem] px-[0.25rem] py-[0.2rem] pl-[0.45rem] min-w-[min(100%,620px)] bg-[color-mix(in_oklch,var(--surface),white_10%)]">
          <Search size={14} />
          <input
            ref={searchInputRef}
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="Find nodes by name, tag, description"
          />
          <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onFindNext}>
            Find next
          </button>
        </div>

        <div className="flex gap-[0.35rem] flex-wrap items-center">
          <input
            value={exportName}
            onChange={(event) => onExportNameChange(event.target.value)}
            placeholder="graph-export"
            aria-label="Graph export file name"
          />
          <label>
            Scale
            <input
              type="number"
              min={1}
              max={5}
              value={exportScale}
              onChange={(event) =>
                onExportScaleChange(clamp(Number(event.target.value) || 2, 1, 5))
              }
            />
          </label>
          <label className="flex items-center gap-[0.45rem]">
            <input
              type="checkbox"
              checked={transparentExport}
              onChange={(event) =>
                onTransparentExportChange(event.target.checked)
              }
            />
            <span>Transparent export</span>
          </label>
          <input
            type="color"
            value={exportBackground}
            onChange={(event) => onExportBackgroundChange(event.target.value)}
            title="Export background"
          />
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={onExportGraphJson}
          >
            <FileJson size={14} /> Graph JSON
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => importGraphRef.current?.click()}
          >
            <FileUp size={14} /> Import graph
          </button>
          <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onExportSvg}>
            <FileDown size={14} /> SVG
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onExportImage("png")}
          >
            <FileImage size={14} /> PNG
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
            onClick={() => onExportImage("jpg")}
          >
            <FileImage size={14} /> JPG
          </button>
          <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onExportPdf}>
            <FileDown size={14} /> PDF
          </button>
          <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onPrintGraph}>
            <FileDown size={14} /> Print
          </button>
          <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-[color-mix(in_oklch,var(--error),var(--ink-0)_24%)] border border-[color-mix(in_oklch,var(--error)_50%,var(--line))] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0" onClick={onClearGraph}>
            <Trash2 size={14} /> Clear graph
          </button>
        </div>
      </div>
    </section>
  );
}
