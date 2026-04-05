import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Graph, GraphEdge, GraphNode } from "../../../lib/workspace";
import { createEdge, createNode } from "../../../lib/workspace";
import {
  arrangeNodesGrid,
  autoLayoutForce,
  autoLayoutHierarchical,
  duplicateSubtree,
  nodeSizeToDimensions,
} from "../../../lib/graph-layout";
import type {
  AlignMode,
  GraphChangeOptions,
  GraphUpdater,
  LayoutKind,
  NodePosition,
  NotifyKind,
} from "./types";
import { nowIso } from "./utils";

interface NodeHandlerDeps {
  graph: Graph | unknown;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeIds: string[];
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  snapToGrid: boolean;
  gridSize: number;
  defaultEdgeType: GraphEdge["type"];
  commitGraph: (updater: GraphUpdater, options?: GraphChangeOptions) => void;
  notify: (type: NotifyKind, message: string) => void;
  onJumpToTodo?: (todoId: string) => void;
}

/**
 * Encapsulates node-manipulation handlers:
 * adding, duplicating, deleting, aligning, collapsing nodes.
 */
export function useNodeHandlers({
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
}: NodeHandlerDeps) {
  const flow = useReactFlow();

  const handleAddNodeAtCenter = useCallback(() => {
    const viewport = flow.getViewport();
    const defaultX = Number.isFinite(viewport.x) ? -viewport.x + 160 : 120;
    const defaultY = Number.isFinite(viewport.y) ? -viewport.y + 120 : 120;

    const node = createNode(`Node ${nodes.length + 1}`);
    const snappedX = snapToGrid
      ? Math.round(defaultX / gridSize) * gridSize
      : defaultX;
    const snappedY = snapToGrid
      ? Math.round(defaultY / gridSize) * gridSize
      : defaultY;
    node.x = snappedX;
    node.y = snappedY;

    commitGraph(
      (prev) => ({
        ...prev,
        nodes: [...prev.nodes, node],
      }),
      { recordHistory: true },
    );

    setSelectedNodeIds([node.id]);
    setSelectedEdgeIds([]);
    notify("success", "Node added.");
  }, [
    flow,
    nodes.length,
    snapToGrid,
    gridSize,
    commitGraph,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    notify,
  ]);

  const handlePaneDoubleClick = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const point = flow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const node = createNode(`Node ${nodes.length + 1}`);
      node.x = snapToGrid ? Math.round(point.x / gridSize) * gridSize : point.x;
      node.y = snapToGrid ? Math.round(point.y / gridSize) * gridSize : point.y;

      commitGraph(
        (prev) => ({
          ...prev,
          nodes: [...prev.nodes, node],
        }),
        { recordHistory: true },
      );

      setSelectedNodeIds([node.id]);
      setSelectedEdgeIds([]);
    },
    [
      flow,
      nodes.length,
      snapToGrid,
      gridSize,
      commitGraph,
      setSelectedNodeIds,
      setSelectedEdgeIds,
    ],
  );

  const handleDeleteSelection = useCallback(() => {
    if (selectedNodeIds.length === 0) {
      return;
    }

    const nodeSet: Set<string> = new Set(selectedNodeIds);

    commitGraph(
      (prev) => ({
        ...prev,
        nodes: prev.nodes.filter((node) => !nodeSet.has(node.id)),
        edges: prev.edges.filter(
          (edge) => !nodeSet.has(edge.from) && !nodeSet.has(edge.to),
        ),
      }),
      { recordHistory: true },
    );

    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    notify("success", "Selection deleted.");
  }, [
    selectedNodeIds,
    commitGraph,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    notify,
  ]);

  const handleDuplicateSelection = useCallback(() => {
    if (selectedNodeIds.length === 0) {
      notify("warning", "Select at least one node to duplicate.");
      return;
    }

    const selectedSet: Set<string> = new Set(selectedNodeIds);
    const map: Map<string, string> = new Map();

    const clones = nodes
      .filter((node) => selectedSet.has(node.id))
      .map((node) => {
        const clone: GraphNode = {
          ...node,
          id: createNode().id,
          label: `${node.label} copy`,
          x: node.x + 84,
          y: node.y + 72,
          collapsed: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        map.set(node.id, clone.id);
        return clone;
      });

    const clonedEdges = edges
      .filter((edge) => selectedSet.has(edge.from) && selectedSet.has(edge.to))
      .map((edge) => {
        const from = map.get(edge.from);
        const to = map.get(edge.to);
        if (!from || !to) {
          return null;
        }

        return {
          ...edge,
          id: createEdge("", "").id,
          from,
          to,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
      })
      .filter((edge): edge is GraphEdge => edge !== null);

    commitGraph(
      (prev) => ({
        ...prev,
        nodes: [...prev.nodes, ...clones],
        edges: [...prev.edges, ...clonedEdges],
      }),
      { recordHistory: true },
    );

    setSelectedNodeIds(clones.map((node) => node.id));
    setSelectedEdgeIds([]);
    notify("success", `Duplicated ${clones.length} node(s).`);
  }, [
    selectedNodeIds,
    nodes,
    edges,
    commitGraph,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    notify,
  ]);

  const handleDuplicateSubtree = useCallback(() => {
    const rootId = selectedNodeIds[0];
    if (!rootId) {
      notify("warning", "Select a root node first.");
      return;
    }

    commitGraph((prev) => duplicateSubtree(prev.nodes, prev.edges, rootId), {
      recordHistory: true,
    });

    notify("success", "Subtree duplicated.");
  }, [selectedNodeIds, commitGraph, notify]);

  const alignSelected = useCallback(
    (mode: AlignMode) => {
      const selected = nodes.filter((node) =>
        selectedNodeIds.includes(node.id),
      );
      if (selected.length < 2) {
        notify("warning", "Select at least two nodes to align.");
        return;
      }

      const dimensions: Map<string, { width: number; height: number }> =
        new Map(
          selected.map((node) => [node.id, nodeSizeToDimensions(node.size)]),
        );
      const centersX = selected.map(
        (node) => node.x + (dimensions.get(node.id)?.width || 0) / 2,
      );
      const centersY = selected.map(
        (node) => node.y + (dimensions.get(node.id)?.height || 0) / 2,
      );

      const minX = Math.min(...selected.map((node) => node.x));
      const maxX = Math.max(
        ...selected.map(
          (node) => node.x + (dimensions.get(node.id)?.width || 0),
        ),
      );
      const minY = Math.min(...selected.map((node) => node.y));
      const maxY = Math.max(
        ...selected.map(
          (node) => node.y + (dimensions.get(node.id)?.height || 0),
        ),
      );

      const targetCenterX =
        centersX.reduce((sum, value) => sum + value, 0) / centersX.length;
      const targetCenterY =
        centersY.reduce((sum, value) => sum + value, 0) / centersY.length;

      const selectedSet: Set<string> = new Set(selectedNodeIds);
      commitGraph(
        (prev) => ({
          ...prev,
          nodes: prev.nodes.map((node) => {
            if (!selectedSet.has(node.id)) {
              return node;
            }

            const size = nodeSizeToDimensions(node.size);
            if (mode === "left")
              return { ...node, x: minX, updatedAt: nowIso() };
            if (mode === "right")
              return { ...node, x: maxX - size.width, updatedAt: nowIso() };
            if (mode === "hcenter")
              return {
                ...node,
                x: targetCenterX - size.width / 2,
                updatedAt: nowIso(),
              };
            if (mode === "top")
              return { ...node, y: minY, updatedAt: nowIso() };
            if (mode === "bottom")
              return { ...node, y: maxY - size.height, updatedAt: nowIso() };
            if (mode === "vcenter")
              return {
                ...node,
                y: targetCenterY - size.height / 2,
                updatedAt: nowIso(),
              };
            return node;
          }),
        }),
        { recordHistory: true },
      );
    },
    [nodes, selectedNodeIds, commitGraph, notify],
  );

  const handleAutoLayout = useCallback(
    (kind: LayoutKind) => {
      commitGraph(
        (prev) => ({
          ...prev,
          nodes:
            kind === "force"
              ? autoLayoutForce(prev.nodes, prev.edges)
              : autoLayoutHierarchical(prev.nodes, prev.edges),
        }),
        { recordHistory: true },
      );

      window.requestAnimationFrame(() => {
        flow.fitView({ padding: 0.2, duration: 360 });
      });
    },
    [commitGraph, flow],
  );

  const handleResetPositions = useCallback(() => {
    commitGraph(
      (prev) => ({
        ...prev,
        nodes: arrangeNodesGrid(prev.nodes, 4),
      }),
      { recordHistory: true },
    );

    window.requestAnimationFrame(() => {
      flow.fitView({ padding: 0.18, duration: 320 });
    });
  }, [commitGraph, flow]);

  const handleToggleCollapse = useCallback(() => {
    const nodeId = selectedNodeIds[0];
    if (!nodeId) {
      notify("warning", "Select a node to collapse or expand.");
      return;
    }

    commitGraph(
      (prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                collapsed: !node.collapsed,
                updatedAt: nowIso(),
              }
            : node,
        ),
      }),
      { recordHistory: true },
    );
  }, [selectedNodeIds, commitGraph, notify]);

  const handlePatchActiveNode = useCallback(
    (patch: Partial<GraphNode>) => {
      const nodeId = selectedNodeIds[0];
      if (!nodeId) {
        return;
      }

      commitGraph(
        (prev) => ({
          ...prev,
          nodes: prev.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  ...patch,
                  updatedAt: nowIso(),
                }
              : node,
          ),
        }),
        { recordHistory: true },
      );
    },
    [selectedNodeIds, commitGraph],
  );

  return {
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
  };
}
