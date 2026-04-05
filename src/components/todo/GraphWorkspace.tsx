import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
} from "@xyflow/react";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
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
import {
  computeCriticalPath,
  getDescendantNodeIds,
  getRelatedNodeSet,
  graphEdgeTypeToFlow,
  nodeSizeToDimensions,
  normalizeGraph,
} from "../../lib/graph-layout";
import type { Graph, GraphEdge, GraphNode } from "../../lib/workspace";
import { createNode, createEdge } from "../../lib/workspace";
import {
  DEFAULT_EDGE_TYPE,
  EDGE_TYPES,
  NODE_TYPES,
  PRIORITIES,
  SHAPES,
  SIZES,
  STATUSES,
} from "./graph-workspace/constants";
import type {
  FlowNodeLike,
  GraphWorkspaceProps,
  NodeChangeLike,
  NotifyKind,
  SelectionChangeLike,
  GraphUpdater,
  GraphChangeOptions,
  NodePosition,
  ExportImageFormat,
} from "./graph-workspace/types";
import {
  buildBranchProgress,
  clamp,
  collectHiddenNodeIds,
  downloadFromDataUrl,
  isInputLikeTarget,
  parseTags,
  nowIso,
} from "./graph-workspace/utils";
import { useGraphWorkspaceState } from "./graph-workspace/useGraphWorkspaceState";
import { useNodeHandlers } from "./graph-workspace/useNodeHandlers";
import { useEdgeHandlers } from "./graph-workspace/useEdgeHandlers";
import { useViewportHandlers } from "./graph-workspace/useViewportHandlers";
import { useImportHandlers } from "./graph-workspace/useImportHandlers";
import { useGraphExport } from "./graph-workspace/useGraphExport";
import GraphCanvas from "./graph-workspace/ui/GraphCanvas";
import GraphInspector from "./graph-workspace/ui/GraphInspector";
import GraphToolbar from "./graph-workspace/ui/GraphToolbar";

function GraphWorkspaceInner({
  graph,
  todos,
  onGraphChange,
  onNotify,
  onJumpToTodo,
}: GraphWorkspaceProps) {
  const flow = useReactFlow();
  const importGraphRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Extract all UI state into dedicated hook
  const {
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
  } = useGraphWorkspaceState();

  const normalizedGraph = useMemo(() => normalizeGraph(graph), [graph]);
  const nodes = normalizedGraph.nodes;
  const edges = normalizedGraph.edges;

  const notify = useCallback(
    (type: NotifyKind, message: string) => {
      onNotify?.(type, message);
    },
    [onNotify],
  );

  const commitGraph = useCallback(
    (
      updater: GraphUpdater,
      options: GraphChangeOptions = { recordHistory: true },
    ) => {
      onGraphChange?.((currentGraph: Graph) => {
        const current = normalizeGraph(currentGraph);
        const next = typeof updater === "function" ? updater(current) : updater;
        return normalizeGraph(next);
      }, options);
    },
    [onGraphChange],
  );

  // Extract all handler categories into dedicated hooks
  const {
    handleAddNodeAtCenter,
    handlePaneDoubleClick,
    handleDeleteSelection,
    handleDuplicateSelection,
    handleDuplicateSubtree,
    alignSelected,
    handleAutoLayout,
    handleResetPositions,
    handleToggleCollapse,
    handlePatchActiveNode,
  } = useNodeHandlers({
    graph,
    nodes,
    edges,
    selectedNodeIds,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    snapToGrid,
    gridSize,
    defaultEdgeType,
    commitGraph,
    notify,
  });

  const { handleConnect, handleEdgesChange, applyEdgeType } = useEdgeHandlers({
    edges,
    nodes,
    defaultEdgeType,
    selectedEdgeIds,
    setSelectedEdgeIds,
    commitGraph,
    notify,
  });

  const {
    handleFitView,
    handleResetView,
    handleCenterOnNode,
    handleSavePositions,
    handleLoadPositions,
    handleSelectAll,
    handleClearSelection,
    handleFindFirstMatch,
    savedPositions,
  } = useViewportHandlers({
    nodes,
    selectedNodeIds,
    searchText,
    setSearchText,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    commitGraph,
    notify,
  });

  const { handleImportGraph, handleClearGraph } = useImportHandlers({
    nodes,
    edges,
    selectedNodeIds,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    commitGraph,
    notify,
  });

  const { handleExportGraphJson, handleExportSvg, handlePrintGraph } =
    useGraphExport(nodes, edges, exportName, notify);

  const handleExportImage = useCallback(
    async (format: ExportImageFormat) => {
      try {
        const target = canvasRef.current?.querySelector(
          ".react-flow__viewport",
        );
        if (!target) {
          throw new Error("Graph viewport not found for export.");
        }
        if (!(target instanceof HTMLElement)) {
          throw new Error("Graph viewport is not an HTML element.");
        }

        const config = {
          pixelRatio: clamp(exportScale, 1, 5),
          cacheBust: true,
          backgroundColor: transparentExport ? "transparent" : exportBackground,
        };

        let dataUrl: string;
        if (format === "jpg") {
          dataUrl = await toJpeg(target, {
            ...config,
            quality: 0.92,
            backgroundColor: transparentExport ? "#ffffff" : exportBackground,
          });
        } else {
          dataUrl = await toPng(target, config);
        }

        downloadFromDataUrl(
          `${exportName || "graph-export"}.${format}`,
          dataUrl,
        );
        notify("success", `Graph exported as ${format.toUpperCase()}.`);
      } catch (error) {
        notify(
          "error",
          error instanceof Error ? error.message : "Image export failed.",
        );
      }
    },
    [exportScale, transparentExport, exportBackground, exportName, notify],
  );

  const handleExportPdf = useCallback(async () => {
    try {
      const target = canvasRef.current?.querySelector(".react-flow__viewport");
      if (!target) {
        throw new Error("Graph viewport not found for export.");
      }
      if (!(target instanceof HTMLElement)) {
        throw new Error("Graph viewport is not an HTML element.");
      }

      const config = {
        pixelRatio: clamp(exportScale, 1, 5),
        cacheBust: true,
        backgroundColor: transparentExport ? "transparent" : exportBackground,
      };

      const dataUrl = await toPng(target, config);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(12);
      doc.text(exportName || "Graph Export", 34, 26);

      const availableWidth = pageWidth - 68;
      const availableHeight = pageHeight - 64;
      doc.addImage(dataUrl, "PNG", 34, 34, availableWidth, availableHeight);

      doc.setFontSize(9);
      doc.text(`Exported ${new Date().toLocaleString()}`, 34, pageHeight - 14);
      doc.save(`${exportName || "graph-export"}.pdf`);
      notify("success", "Graph exported as PDF.");
    } catch (error) {
      notify(
        "error",
        error instanceof Error ? error.message : "PDF export failed.",
      );
    }
  }, [exportScale, transparentExport, exportBackground, exportName, notify]);

  useEffect(() => {
    const validNodeIds: Set<string> = new Set(nodes.map((node) => node.id));
    const validEdgeIds: Set<string> = new Set(edges.map((edge) => edge.id));

    setSelectedNodeIds((prev) => prev.filter((id) => validNodeIds.has(id)));
    setSelectedEdgeIds((prev) => prev.filter((id) => validEdgeIds.has(id)));

    if (hoveredNodeId && !validNodeIds.has(hoveredNodeId)) {
      setHoveredNodeId(null);
    }
  }, [nodes, edges, hoveredNodeId]);

  const hiddenNodeIds = useMemo(
    () => collectHiddenNodeIds(nodes, edges),
    [nodes, edges],
  );

  const visibleNodes = useMemo(
    () => nodes.filter((node) => !hiddenNodeIds.has(node.id)),
    [nodes, hiddenNodeIds],
  );

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to),
      ),
    [edges, visibleNodeIds],
  );

  const connectionCounts = useMemo(() => {
    const counts: Map<string, number> = new Map(
      nodes.map((node) => [node.id, 0]),
    );
    edges.forEach((edge) => {
      counts.set(edge.from, (counts.get(edge.from) || 0) + 1);
      counts.set(edge.to, (counts.get(edge.to) || 0) + 1);
    });
    return counts;
  }, [nodes, edges]);

  const branchProgress = useMemo(
    () => buildBranchProgress(nodes, edges),
    [nodes, edges],
  );

  const criticalPath = useMemo(() => {
    if (!showCriticalPath) {
      return { nodeIds: [], edgeIds: [] };
    }
    return computeCriticalPath(nodes, edges);
  }, [showCriticalPath, nodes, edges]);

  const criticalNodeIds = useMemo(
    () => new Set(criticalPath.nodeIds),
    [criticalPath.nodeIds],
  );
  const criticalEdgeIds = useMemo(
    () => new Set(criticalPath.edgeIds),
    [criticalPath.edgeIds],
  );

  const searchMatches = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return new Set<string>();
    }

    return new Set<string>(
      nodes
        .filter((node) => {
          const bucket = [
            node.label,
            node.description,
            node.alias,
            node.owner,
            ...(Array.isArray(node.tags) ? node.tags : []),
          ]
            .join(" ")
            .toLowerCase();
          return bucket.includes(query);
        })
        .map((node) => node.id),
    );
  }, [nodes, searchText]);

  const anchorNodeId = hoveredNodeId || selectedNodeIds[0] || null;

  const relatedSet = useMemo(() => {
    if (!anchorNodeId) {
      return new Set();
    }
    return getRelatedNodeSet(anchorNodeId, edges);
  }, [anchorNodeId, edges]);

  const flowNodes = useMemo(
    () =>
      visibleNodes.map((node) => {
        const dimensions = nodeSizeToDimensions(node.size);
        const dimmed = focusMode && anchorNodeId && !relatedSet.has(node.id);
        const searchMatch =
          searchMatches.size > 0 && searchMatches.has(node.id);

        return {
          id: node.id,
          type: "graphNode",
          position: { x: node.x, y: node.y },
          selected: selectedNodeIds.includes(node.id),
          style: {
            width: dimensions.width,
            height: dimensions.height,
          },
          data: {
            ...node,
            connectionCount: connectionCounts.get(node.id) || 0,
            branchProgress: branchProgress.get(node.id),
            dimmed,
            related: relatedSet.has(node.id),
            critical: criticalNodeIds.has(node.id),
            searchMatch,
            onToggleCompleted: (nodeId: string) => {
              commitGraph(
                (prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((entry) =>
                    entry.id === nodeId
                      ? {
                          ...entry,
                          completed: !entry.completed,
                          status: !entry.completed ? "done" : "todo",
                          updatedAt: nowIso(),
                        }
                      : entry,
                  ),
                }),
                { recordHistory: true },
              );
            },
            onRename: (nodeId: string) => {
              const target = nodes.find((entry) => entry.id === nodeId);
              if (!target) {
                return;
              }

              const nextLabel = window.prompt("Rename node", target.label);
              if (!nextLabel) {
                return;
              }

              commitGraph(
                (prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((entry) =>
                    entry.id === nodeId
                      ? {
                          ...entry,
                          label: nextLabel.trim() || entry.label,
                          updatedAt: nowIso(),
                        }
                      : entry,
                  ),
                }),
                { recordHistory: true },
              );
            },
            onAddChild: (nodeId: string) => {
              const parent = nodes.find((entry) => entry.id === nodeId);
              if (!parent) {
                return;
              }

              const child = createNode(`Child of ${parent.label}`);
              const parentSize = nodeSizeToDimensions(parent.size);
              child.x = parent.x + parentSize.width + 94;
              child.y = parent.y + 32;

              const edge = createEdge(parent.id, child.id);
              edge.type = defaultEdgeType;

              commitGraph(
                (prev) => ({
                  ...prev,
                  nodes: [...prev.nodes, child],
                  edges: [...prev.edges, edge],
                }),
                { recordHistory: true },
              );

              setSelectedNodeIds([child.id]);
              setSelectedEdgeIds([]);
              notify("success", "Child node created.");
            },
          },
        };
      }),
    [
      visibleNodes,
      focusMode,
      anchorNodeId,
      relatedSet,
      searchMatches,
      selectedNodeIds,
      connectionCounts,
      branchProgress,
      criticalNodeIds,
      commitGraph,
      nodes,
      defaultEdgeType,
      notify,
    ],
  );

  const flowEdges = useMemo(
    () =>
      visibleEdges.map((edge) => {
        const isCritical = criticalEdgeIds.has(edge.id);
        const isDimmed =
          focusMode &&
          anchorNodeId &&
          !(relatedSet.has(edge.from) && relatedSet.has(edge.to));

        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          type: graphEdgeTypeToFlow(edge.type),
          selected: selectedEdgeIds.includes(edge.id),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCritical ? "#9f3027" : "#7b5640",
          },
          style: {
            stroke: isCritical ? "#9f3027" : "#7b5640",
            strokeWidth: isCritical ? 2.8 : 2,
            opacity: isDimmed ? 0.2 : 0.92,
          },
        };
      }),
    [
      visibleEdges,
      criticalEdgeIds,
      focusMode,
      anchorNodeId,
      relatedSet,
      selectedEdgeIds,
    ],
  );

  const activeNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeIds[0]) || null,
    [nodes, selectedNodeIds],
  );

  const selectedLinkedTodo = useMemo(
    () => todos.find((todo) => todo.id === activeNode?.todoId) || null,
    [todos, activeNode?.todoId],
  );

  // ReactFlow event handlers (specific to this component, not extracted)
  const handleNodesChange = useCallback(
    (changes: NodeChangeLike[]) => {
      const positionUpdates = changes.filter(
        (change) => change.type === "position" && change.position,
      );
      const removals = changes.filter((change) => change.type === "remove");

      if (positionUpdates.length === 0 && removals.length === 0) {
        return;
      }

      commitGraph(
        (prev) => {
          let nextNodes = prev.nodes;
          let nextEdges = prev.edges;

          if (positionUpdates.length > 0) {
            const map: Map<string, NodePosition> = new Map(
              positionUpdates
                .filter(
                  (
                    change,
                  ): change is NodeChangeLike & {
                    id: string;
                    position: NodePosition;
                  } =>
                    typeof change.id === "string" && Boolean(change.position),
                )
                .map((change) => [change.id, change.position]),
            );
            nextNodes = nextNodes.map((node) => {
              const update = map.get(node.id);
              if (!update) {
                return node;
              }

              return {
                ...node,
                x: update.x,
                y: update.y,
                updatedAt: nowIso(),
              };
            });
          }

          if (removals.length > 0) {
            const ids: Set<string> = new Set(
              removals
                .map((change) => change.id)
                .filter((id): id is string => typeof id === "string"),
            );
            nextNodes = nextNodes.filter((node) => !ids.has(node.id));
            nextEdges = nextEdges.filter(
              (edge) => !ids.has(edge.from) && !ids.has(edge.to),
            );
          }

          return {
            ...prev,
            nodes: nextNodes,
            edges: nextEdges,
          };
        },
        { recordHistory: false },
      );
    },
    [commitGraph],
  );

  const handleNodeDragStop = useCallback(
    (_event: unknown, node: { id: string; position: NodePosition }) => {
      commitGraph(
        (prev) => ({
          ...prev,
          nodes: prev.nodes.map((entry) =>
            entry.id === node.id
              ? {
                  ...entry,
                  x: node.position.x,
                  y: node.position.y,
                  updatedAt: nowIso(),
                }
              : entry,
          ),
        }),
        { recordHistory: true },
      );
    },
    [commitGraph],
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: SelectionChangeLike) => {
      setSelectedNodeIds(selectedNodes.map((node) => node.id));
      setSelectedEdgeIds(selectedEdges.map((edge) => edge.id));
    },
    [setSelectedNodeIds, setSelectedEdgeIds],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isInputLikeTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedNodeIds.length + selectedEdgeIds.length > 0
      ) {
        event.preventDefault();
        handleDeleteSelection();
        return;
      }

      if (isMod && key === "a") {
        event.preventDefault();
        handleSelectAll();
        return;
      }

      if (isMod && key === "d") {
        event.preventDefault();
        handleDuplicateSelection();
        return;
      }

      if (isMod && key === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (key === "escape") {
        event.preventDefault();
        handleClearSelection();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedNodeIds.length,
    selectedEdgeIds.length,
    handleDeleteSelection,
    handleSelectAll,
    handleDuplicateSelection,
    handleClearSelection,
  ]);

  useEffect(() => {
    if (!flowNodes.length) {
      return;
    }

    window.requestAnimationFrame(() => {
      flow.fitView({ padding: 0.18, duration: 260 });
    });
  }, []);

  return (
    <main className="workspace-main graph-mode-main">
      <input
        ref={importGraphRef}
        type="file"
        accept=".json,.graph"
        hidden
        onChange={(event) => {
          void handleImportGraph(event);
        }}
      />

      <GraphToolbar
        importGraphRef={importGraphRef}
        searchInputRef={searchInputRef}
        defaultEdgeType={defaultEdgeType}
        onDefaultEdgeTypeChange={setDefaultEdgeType}
        onApplyEdgeType={() => applyEdgeType(defaultEdgeType)}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        snapToGrid={snapToGrid}
        onSnapToGridChange={setSnapToGrid}
        showMiniMap={showMiniMap}
        onShowMiniMapChange={setShowMiniMap}
        focusMode={focusMode}
        onFocusModeChange={setFocusMode}
        showCriticalPath={showCriticalPath}
        onShowCriticalPathChange={setShowCriticalPath}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onFindNext={() => handleFindFirstMatch(searchMatches)}
        exportName={exportName}
        onExportNameChange={setExportName}
        exportScale={exportScale}
        onExportScaleChange={setExportScale}
        transparentExport={transparentExport}
        onTransparentExportChange={setTransparentExport}
        exportBackground={exportBackground}
        onExportBackgroundChange={setExportBackground}
        selectedNodeId={selectedNodeIds[0] || null}
        onAddNodeAtCenter={handleAddNodeAtCenter}
        onDuplicateSelection={handleDuplicateSelection}
        onDuplicateSubtree={handleDuplicateSubtree}
        onDeleteSelection={handleDeleteSelection}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onToggleCollapse={handleToggleCollapse}
        onAlignSelected={alignSelected}
        onAutoLayout={handleAutoLayout}
        onResetPositions={handleResetPositions}
        onSavePositions={handleSavePositions}
        onLoadPositions={handleLoadPositions}
        onFitView={handleFitView}
        onResetView={handleResetView}
        onCenterOnSelected={() => {
          if (selectedNodeIds[0]) {
            handleCenterOnNode(selectedNodeIds[0]);
          }
        }}
        onExportGraphJson={handleExportGraphJson}
        onExportSvg={handleExportSvg}
        onExportImage={(format) => void handleExportImage(format)}
        onExportPdf={() => void handleExportPdf()}
        onPrintGraph={handlePrintGraph}
        onClearGraph={handleClearGraph}
      />

      <GraphCanvas
        canvasRef={canvasRef}
        nodeTypes={NODE_TYPES}
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={handleNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        onPaneDoubleClick={handlePaneDoubleClick}
        onNodeMouseEnter={(_event, node: FlowNodeLike) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        snapToGrid={snapToGrid}
        gridSize={gridSize}
        showMiniMap={showMiniMap}
        searchMatches={searchMatches}
      />

      <GraphInspector
        nodeCount={nodes.length}
        edgeCount={edges.length}
        selectedNodeCount={selectedNodeIds.length}
        selectedEdgeCount={selectedEdgeIds.length}
        activeNode={activeNode}
        edges={edges}
        todos={todos}
        linkedTodo={selectedLinkedTodo}
        onPatchActiveNode={handlePatchActiveNode}
        onJumpToTodo={onJumpToTodo}
        onCenterOnNode={handleCenterOnNode}
        onNotify={notify}
      />
    </main>
  );
}

export default function GraphWorkspace(props: GraphWorkspaceProps) {
  return (
    <ReactFlowProvider>
      <GraphWorkspaceInner {...props} />
    </ReactFlowProvider>
  );
}
