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
    <section className="panel graph-toolbar-panel">
      <div className="graph-toolbar-row">
        <div className="graph-tool-group">
          <button
            type="button"
            className="secondary-button"
            onClick={onAddNodeAtCenter}
          >
            <Sparkles size={14} /> Add node
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onDuplicateSelection}
          >
            <CopyPlus size={14} /> Duplicate
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onDuplicateSubtree}
          >
            <Workflow size={14} /> Duplicate subtree
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={onDeleteSelection}
          >
            <Trash2 size={14} /> Delete selected
          </button>
        </div>

        <div className="graph-tool-group">
          <button type="button" className="secondary-button" onClick={onSelectAll}>
            <BringToFront size={14} /> Select all
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onClearSelection}
          >
            <Minimize size={14} /> Deselect
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onToggleCollapse}
          >
            <Network size={14} /> Collapse/Expand branch
          </button>
        </div>
      </div>

      <div className="graph-toolbar-row">
        <div className="graph-tool-group">
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
            className="secondary-button"
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

          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(event) => onSnapToGridChange(event.target.checked)}
            />
            <span>Snap to grid</span>
          </label>

          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={showMiniMap}
              onChange={(event) => onShowMiniMapChange(event.target.checked)}
            />
            <span>Minimap</span>
          </label>

          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={focusMode}
              onChange={(event) => onFocusModeChange(event.target.checked)}
            />
            <span>Focus mode</span>
          </label>

          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={showCriticalPath}
              onChange={(event) => onShowCriticalPathChange(event.target.checked)}
            />
            <span>Critical path</span>
          </label>
        </div>
      </div>

      <div className="graph-toolbar-row">
        <div className="graph-tool-group">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAlignSelected("left")}
          >
            <AlignCenterVertical size={14} /> Align left
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAlignSelected("right")}
          >
            <AlignCenterVertical size={14} /> Align right
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAlignSelected("hcenter")}
          >
            <AlignHorizontalJustifyCenter size={14} /> Align center
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAlignSelected("top")}
          >
            <AlignCenterVertical size={14} /> Align top
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAlignSelected("bottom")}
          >
            <AlignCenterVertical size={14} /> Align bottom
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAlignSelected("vcenter")}
          >
            <AlignVerticalJustifyCenter size={14} /> Align middle
          </button>
        </div>
      </div>

      <div className="graph-toolbar-row">
        <div className="graph-tool-group">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAutoLayout("hierarchical")}
          >
            <Workflow size={14} /> Auto-layout (hierarchy)
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAutoLayout("force")}
          >
            <Sparkles size={14} /> Auto-layout (force)
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onResetPositions}
          >
            <Grid2x2 size={14} /> Reset positions
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onSavePositions}
          >
            <FileDown size={14} /> Save positions
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onLoadPositions}
          >
            <FileUp size={14} /> Load positions
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onFitView}
          >
            <Maximize size={14} /> Fit graph
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onResetView}
          >
            <RotateCcw size={14} /> Reset view
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onCenterOnSelected}
            disabled={!selectedNodeId}
          >
            <Focus size={14} /> Center on selected
          </button>
        </div>
      </div>

      <div className="graph-toolbar-row">
        <div className="graph-search-wrap">
          <Search size={14} />
          <input
            ref={searchInputRef}
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="Find nodes by name, tag, description"
          />
          <button type="button" className="secondary-button" onClick={onFindNext}>
            Find next
          </button>
        </div>

        <div className="graph-tool-group">
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
          <label className="inline-toggle">
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
            className="secondary-button"
            onClick={onExportGraphJson}
          >
            <FileJson size={14} /> Graph JSON
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => importGraphRef.current?.click()}
          >
            <FileUp size={14} /> Import graph
          </button>
          <button type="button" className="secondary-button" onClick={onExportSvg}>
            <FileDown size={14} /> SVG
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onExportImage("png")}
          >
            <FileImage size={14} /> PNG
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onExportImage("jpg")}
          >
            <FileImage size={14} /> JPG
          </button>
          <button type="button" className="secondary-button" onClick={onExportPdf}>
            <FileDown size={14} /> PDF
          </button>
          <button type="button" className="secondary-button" onClick={onPrintGraph}>
            <FileDown size={14} /> Print
          </button>
          <button type="button" className="danger-button" onClick={onClearGraph}>
            <Trash2 size={14} /> Clear graph
          </button>
        </div>
      </div>
    </section>
  );
}
