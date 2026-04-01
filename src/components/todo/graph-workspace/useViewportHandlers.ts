import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { GraphNode } from '../../../lib/workspace';
import { nodeSizeToDimensions } from '../../../lib/graph-layout';
import type {
  GraphChangeOptions,
  GraphUpdater,
  NodePosition,
  NotifyKind
} from './types';
import { nowIso } from './utils';

interface ViewportHandlerDeps {
  nodes: GraphNode[];
  selectedNodeIds: string[];
  searchText: string;
  setSearchText: (text: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  commitGraph: (updater: GraphUpdater, options?: GraphChangeOptions) => void;
  notify: (type: NotifyKind, message: string) => void;
}

/**
 * Encapsulates viewport/navigation handlers:
 * fit view, pan, zoom, position save/load, search, center on node.
 */
export function useViewportHandlers({
  nodes,
  selectedNodeIds,
  searchText,
  setSearchText,
  setSelectedNodeIds,
  setSelectedEdgeIds,
  commitGraph,
  notify
}: ViewportHandlerDeps) {
  const flow = useReactFlow();
  const [savedPositions, setSavedPositions] = useState<Record<string, NodePosition> | null>(null);

  const handleFitView = useCallback(() => {
    flow.fitView({ padding: 0.2, duration: 360 });
  }, [flow]);

  const handleResetView = useCallback(() => {
    flow.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 360 });
  }, [flow]);

  const handleCenterOnNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((entry) => entry.id === nodeId);
      if (!node) {
        return;
      }
      const size = nodeSizeToDimensions(node.size);
      flow.setCenter(node.x + size.width / 2, node.y + size.height / 2, {
        zoom: 1.15,
        duration: 360
      });
    },
    [nodes, flow]
  );

  const handleSavePositions = useCallback(() => {
    const snapshot = Object.fromEntries(nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
    setSavedPositions(snapshot);
    notify('success', 'Node positions snapshot saved.');
  }, [nodes, notify]);

  const handleLoadPositions = useCallback(() => {
    if (!savedPositions) {
      notify('warning', 'No saved position snapshot in this session.');
      return;
    }

    commitGraph(
      (prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => {
          const snapshot = savedPositions[node.id];
          if (!snapshot) {
            return node;
          }
          return {
            ...node,
            x: snapshot.x,
            y: snapshot.y,
            updatedAt: nowIso()
          };
        })
      }),
      { recordHistory: true }
    );

    notify('success', 'Restored node positions snapshot.');
  }, [savedPositions, commitGraph, notify]);

  const handleSelectAll = useCallback(() => {
    setSelectedNodeIds(nodes.map((node) => node.id));
    setSelectedEdgeIds([]);
  }, [nodes, setSelectedNodeIds, setSelectedEdgeIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, [setSelectedNodeIds, setSelectedEdgeIds]);

  const handleFindFirstMatch = useCallback(
    (searchMatches: Set<string>) => {
      const firstMatchId = [...searchMatches][0] || null;
      if (!firstMatchId) {
        notify('warning', 'No node matches the current search.');
        return;
      }

      setSelectedNodeIds([firstMatchId]);
      setSelectedEdgeIds([]);
      handleCenterOnNode(firstMatchId);
    },
    [setSelectedNodeIds, setSelectedEdgeIds, handleCenterOnNode, notify]
  );

  return {
    handleFitView,
    handleResetView,
    handleCenterOnNode,
    handleSavePositions,
    handleLoadPositions,
    handleSelectAll,
    handleClearSelection,
    handleFindFirstMatch,
    savedPositions
  };
}
