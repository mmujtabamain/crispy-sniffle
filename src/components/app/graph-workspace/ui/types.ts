import { ReactFlow } from "@xyflow/react";
import type {
  ComponentProps,
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  RefObject,
} from "react";
import type { GraphEdge, GraphNode, Todo } from "../../../../lib/workspace";
import type { ExportImageFormat, FlowNodeLike, NotifyKind } from "../types";

export type GraphCanvasNodes = ComponentProps<typeof ReactFlow>["nodes"];
export type GraphCanvasEdges = ComponentProps<typeof ReactFlow>["edges"];
export type GraphCanvasOnNodesChange = NonNullable<
  ComponentProps<typeof ReactFlow>["onNodesChange"]
>;
export type GraphCanvasOnNodeDragStop = NonNullable<
  ComponentProps<typeof ReactFlow>["onNodeDragStop"]
>;
export type GraphCanvasOnEdgesChange = NonNullable<
  ComponentProps<typeof ReactFlow>["onEdgesChange"]
>;
export type GraphCanvasOnConnect = NonNullable<
  ComponentProps<typeof ReactFlow>["onConnect"]
>;
export type GraphCanvasOnSelectionChange = NonNullable<
  ComponentProps<typeof ReactFlow>["onSelectionChange"]
>;

export interface GraphToolbarProps {
  importGraphRef: RefObject<HTMLInputElement | null>;
  searchInputRef: RefObject<HTMLInputElement | null>;
  defaultEdgeType: GraphEdge["type"];
  onDefaultEdgeTypeChange: (value: GraphEdge["type"]) => void;
  onApplyEdgeType: () => void;
  gridSize: number;
  onGridSizeChange: (value: number) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (value: boolean) => void;
  showMiniMap: boolean;
  onShowMiniMapChange: (value: boolean) => void;
  focusMode: boolean;
  onFocusModeChange: (value: boolean) => void;
  showCriticalPath: boolean;
  onShowCriticalPathChange: (value: boolean) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onFindNext: () => void;
  exportName: string;
  onExportNameChange: (value: string) => void;
  exportScale: number;
  onExportScaleChange: (value: number) => void;
  transparentExport: boolean;
  onTransparentExportChange: (value: boolean) => void;
  exportBackground: string;
  onExportBackgroundChange: (value: string) => void;
  selectedNodeId: string | null;
  onAddNodeAtCenter: () => void;
  onDuplicateSelection: () => void;
  onDuplicateSubtree: () => void;
  onDeleteSelection: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onToggleCollapse: () => void;
  onAlignSelected: (
    alignment: "left" | "right" | "hcenter" | "top" | "bottom" | "vcenter",
  ) => void;
  onAutoLayout: (mode: "hierarchical" | "force") => void;
  onResetPositions: () => void;
  onSavePositions: () => void;
  onLoadPositions: () => void;
  onFitView: () => void;
  onResetView: () => void;
  onCenterOnSelected: () => void;
  onExportGraphJson: () => void;
  onExportSvg: () => void;
  onExportImage: (format: ExportImageFormat) => void;
  onExportPdf: () => void;
  onPrintGraph: () => void;
  onClearGraph: () => void;
}

export interface GraphCanvasProps {
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  nodeTypes: ComponentProps<typeof ReactFlow>["nodeTypes"];
  nodes: GraphCanvasNodes;
  edges: GraphCanvasEdges;
  onNodesChange: GraphCanvasOnNodesChange;
  onNodeDragStop: GraphCanvasOnNodeDragStop;
  onEdgesChange: GraphCanvasOnEdgesChange;
  onConnect: GraphCanvasOnConnect;
  onSelectionChange: GraphCanvasOnSelectionChange;
  onPaneDoubleClick: (event: ReactMouseEvent<Element, MouseEvent>) => void;
  onNodeMouseEnter: (_event: unknown, node: FlowNodeLike) => void;
  onNodeMouseLeave: () => void;
  snapToGrid: boolean;
  gridSize: number;
  showMiniMap: boolean;
  searchMatches: Set<string>;
}

export interface GraphInspectorProps {
  nodeCount: number;
  edgeCount: number;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  activeNode: GraphNode | null;
  edges: GraphEdge[];
  todos: Todo[];
  linkedTodo: Todo | null;
  onPatchActiveNode: (patch: Partial<GraphNode>) => void;
  onJumpToTodo?: (todoId: string) => void;
  onCenterOnNode: (nodeId: string) => void;
  onNotify: (type: NotifyKind, message: string) => void;
}
