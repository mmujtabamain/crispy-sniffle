import { useCallback } from "react";
import type { ChangeEvent } from "react";
import type { GraphEdge, GraphNode } from "../../../lib/workspace";
import { createEdge, createNode } from "../../../lib/workspace";
import { normalizeGraph } from "../../../lib/graph-layout";
import type { GraphChangeOptions, GraphUpdater, NotifyKind } from "./types";
import { nowIso } from "./utils";

interface ImportHandlerDeps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeIds: string[];
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  commitGraph: (updater: GraphUpdater, options?: GraphChangeOptions) => void;
  notify: (type: NotifyKind, message: string) => void;
}

/**
 * Encapsulates graph import and clear functionality.
 * Handles file-based graph import and full graph clearing with confirmation.
 */
export function useImportHandlers({
  nodes,
  edges,
  selectedNodeIds,
  setSelectedNodeIds,
  setSelectedEdgeIds,
  commitGraph,
  notify,
}: ImportHandlerDeps) {
  const handleImportGraph = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw);
        const input = parsed?.graph ? parsed.graph : parsed;
        const incoming = normalizeGraph(input);

        if (incoming.nodes.length === 0) {
          notify("warning", "Imported graph file had no nodes.");
          event.target.value = "";
          return;
        }

        const replace = window.confirm(
          "Replace current graph? Click Cancel to merge.",
        );

        if (replace) {
          commitGraph(incoming, { recordHistory: true });
        } else {
          const existingNodeIds: Set<string> = new Set(
            nodes.map((node) => node.id),
          );
          const existingEdgeIds: Set<string> = new Set(
            edges.map((edge) => edge.id),
          );
          const nodeIdMap: Map<string, string> = new Map();

          const remappedNodes = incoming.nodes.map((node) => {
            let nextId = node.id;
            if (existingNodeIds.has(nextId) || nodeIdMap.has(nextId)) {
              nextId = createNode().id;
            }

            existingNodeIds.add(nextId);
            nodeIdMap.set(node.id, nextId);

            return {
              ...node,
              id: nextId,
              createdAt: nowIso(),
              updatedAt: nowIso(),
            };
          });

          const remappedEdges = incoming.edges
            .map((edge) => {
              const from = nodeIdMap.get(edge.from) || edge.from;
              const to = nodeIdMap.get(edge.to) || edge.to;
              if (!existingNodeIds.has(from) || !existingNodeIds.has(to)) {
                return null;
              }

              let nextEdgeId = edge.id;
              if (existingEdgeIds.has(nextEdgeId)) {
                nextEdgeId = createEdge("", "").id;
              }
              existingEdgeIds.add(nextEdgeId);

              return {
                ...edge,
                id: nextEdgeId,
                from,
                to,
                createdAt: nowIso(),
                updatedAt: nowIso(),
              };
            })
            .filter((edge): edge is GraphEdge => edge !== null);

          commitGraph(
            (prev) => ({
              nodes: [...prev.nodes, ...remappedNodes],
              edges: [...prev.edges, ...remappedEdges],
            }),
            { recordHistory: true },
          );
        }

        notify("success", `Imported ${incoming.nodes.length} node(s).`);
      } catch (error) {
        notify(
          "error",
          error instanceof Error ? error.message : "Graph import failed.",
        );
      } finally {
        event.target.value = "";
      }
    },
    [nodes, edges, commitGraph, notify],
  );

  const handleClearGraph = useCallback(() => {
    if (nodes.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Clear all nodes and connections in graph mode?",
    );
    if (!confirmed) {
      return;
    }

    commitGraph(
      {
        nodes: [],
        edges: [],
      },
      { recordHistory: true },
    );

    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    notify("success", "Graph cleared.");
  }, [
    nodes.length,
    commitGraph,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    notify,
  ]);

  return {
    handleImportGraph,
    handleClearGraph,
  };
}
