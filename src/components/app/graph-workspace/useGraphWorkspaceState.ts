import { useState } from "react";
import type { GraphEdge, GraphNode } from "../../../lib/workspace";
import type { NodePosition } from "./types";

/**
 * Central state management for GraphWorkspace UI.
 * Consolidates 8+ useState calls into a reusable, testable hook.
 */
export function useGraphWorkspaceState() {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const [defaultEdgeType, setDefaultEdgeType] =
    useState<GraphEdge["type"]>("curved");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(28);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [exportName, setExportName] = useState("graph-export");
  const [exportScale, setExportScale] = useState(2);
  const [transparentExport, setTransparentExport] = useState(false);
  const [exportBackground, setExportBackground] = useState("#f4ede6");

  const [savedPositions, setSavedPositions] = useState<Record<
    string,
    NodePosition
  > | null>(null);

  return {
    selectedNodeIds,
    setSelectedNodeIds,
    selectedEdgeIds,
    setSelectedEdgeIds,
    hoveredNodeId,
    setHoveredNodeId,
    defaultEdgeType,
    setDefaultEdgeType,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    showMiniMap,
    setShowMiniMap,
    focusMode,
    setFocusMode,
    showCriticalPath,
    setShowCriticalPath,
    searchText,
    setSearchText,
    exportName,
    setExportName,
    exportScale,
    setExportScale,
    transparentExport,
    setTransparentExport,
    exportBackground,
    setExportBackground,
    savedPositions,
    setSavedPositions,
  };
}
