import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import type { GraphEdge, GraphNode } from "../../../lib/workspace";
import { createEdge, createNode } from "../../../lib/workspace";
import { wouldCreateCycle } from "../../../lib/graph-layout";
import type {
  ConnectParams,
  GraphChangeOptions,
  GraphUpdater,
  NodeChangeLike,
  NodePosition,
  NotifyKind,
} from "./types";
import { nowIso } from "./utils";

interface EdgeHandlerDeps {
  edges: GraphEdge[];
  nodes: GraphNode[];
  defaultEdgeType: GraphEdge["type"];
  selectedEdgeIds: string[];
  setSelectedEdgeIds: (ids: string[]) => void;
  commitGraph: (updater: GraphUpdater, options?: GraphChangeOptions) => void;
  notify: (type: NotifyKind, message: string) => void;
}

/**
 * Encapsulates edge-manipulation handlers:
 * creating connections, deleting edges, changing edge types.
 */
export function useEdgeHandlers({
  edges,
  nodes,
  defaultEdgeType,
  selectedEdgeIds,
  setSelectedEdgeIds,
  commitGraph,
  notify,
}: EdgeHandlerDeps) {
  const flow = useReactFlow();

  const handleConnect = useCallback(
    (params: ConnectParams) => {
      const { source, target } = params;

      if (!source || !target) {
        return;
      }

      if (source === target) {
        notify("warning", "Cannot connect a node to itself.");
        return;
      }

      if (wouldCreateCycle(edges, source, target)) {
        notify(
          "error",
          "Connection rejected to prevent a circular dependency.",
        );
        return;
      }

      const duplicate = edges.some(
        (edge) => edge.from === source && edge.to === target,
      );
      if (duplicate) {
        notify("warning", "That connection already exists.");
        return;
      }

      const edge = createEdge(source, target);
      edge.type = defaultEdgeType;

      commitGraph(
        (prev) => ({
          ...prev,
          edges: [...prev.edges, edge],
        }),
        { recordHistory: true },
      );
    },
    [edges, defaultEdgeType, commitGraph, notify],
  );

  const handleEdgesChange = useCallback(
    (changes: NodeChangeLike[]) => {
      const removals = changes.filter((change) => change.type === "remove");
      if (removals.length === 0) {
        return;
      }

      const ids: Set<string> = new Set(
        removals
          .map((change) => change.id)
          .filter((id): id is string => typeof id === "string"),
      );
      commitGraph(
        (prev) => ({
          ...prev,
          edges: prev.edges.filter((edge) => !ids.has(edge.id)),
        }),
        { recordHistory: true },
      );
    },
    [commitGraph],
  );

  const applyEdgeType = useCallback(
    (type: GraphEdge["type"]) => {
      if (selectedEdgeIds.length === 0) {
        notify("success", `New connections will use ${type} style.`);
        return;
      }

      const selected: Set<string> = new Set(selectedEdgeIds);
      commitGraph(
        (prev) => ({
          ...prev,
          edges: prev.edges.map((edge) =>
            selected.has(edge.id)
              ? {
                  ...edge,
                  type,
                  updatedAt: nowIso(),
                }
              : edge,
          ),
        }),
        { recordHistory: true },
      );

      notify("success", "Edge style updated for selection.");
    },
    [selectedEdgeIds, commitGraph, notify],
  );

  return {
    handleConnect,
    handleEdgesChange,
    applyEdgeType,
  };
}
