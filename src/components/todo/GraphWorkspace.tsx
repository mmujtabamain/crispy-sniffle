import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow
} from '@xyflow/react';
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
  Workflow
} from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import GraphNodeCard from './GraphNodeCard';
import {
  arrangeNodesGrid,
  autoLayoutForce,
  autoLayoutHierarchical,
  computeCriticalPath,
  duplicateSubtree,
  getDescendantNodeIds,
  getRelatedNodeSet,
  graphEdgeTypeToFlow,
  graphToSvg,
  nodeSizeToDimensions,
  normalizeGraph,
  wouldCreateCycle
} from '../../lib/graph-layout';
import { createEdge, createNode } from '../../lib/workspace';
import type { Graph, GraphEdge, GraphNode, Todo } from '../../lib/workspace';

type NotifyKind = 'success' | 'warning' | 'error';
type AlignMode = 'left' | 'right' | 'hcenter' | 'top' | 'bottom' | 'vcenter';
type LayoutKind = 'hierarchical' | 'force';
type ExportImageFormat = 'png' | 'jpg';

interface GraphChangeOptions {
  recordHistory?: boolean;
}

type GraphUpdater = Graph | ((currentGraph: Graph) => Graph);

interface GraphWorkspaceProps {
  graph: Graph | unknown;
  todos: Todo[];
  onGraphChange?: (nextGraphOrUpdater: GraphUpdater, options?: GraphChangeOptions) => void;
  onNotify?: (type: NotifyKind, message: string) => void;
  onJumpToTodo?: (todoId: string) => void;
}

interface EdgeTypeOption {
  value: GraphEdge['type'];
  label: string;
}

interface NodePosition {
  x: number;
  y: number;
}

interface NodeChangeLike {
  id?: string;
  type: string;
  position?: NodePosition;
}

interface SelectionChangeLike {
  nodes: Array<{ id: string }>;
  edges: Array<{ id: string }>;
}

interface ConnectParams {
  source: string | null;
  target: string | null;
}

interface FlowNodeLike {
  id: string;
  position: NodePosition;
  data?: {
    color?: string;
  };
}

const NODE_TYPES = {
  graphNode: GraphNodeCard
};

const EDGE_TYPES: EdgeTypeOption[] = [
  { value: 'curved', label: 'Curved' },
  { value: 'straight', label: 'Straight' },
  { value: 'orthogonal', label: 'Orthogonal' }
];

const SHAPES: GraphNode['shape'][] = ['square', 'circle', 'diamond', 'pill'];
const SIZES: GraphNode['size'][] = ['sm', 'md', 'lg'];
const PRIORITIES: Todo['priority'][] = ['low', 'medium', 'high', 'critical'];
const STATUSES: Todo['status'][] = ['todo', 'doing', 'done', 'blocked'];

function nowIso() {
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function createDownload(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadFromDataUrl(fileName: string, dataUrl: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function isInputLikeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

function collectHiddenNodeIds(nodes: GraphNode[], edges: GraphEdge[]): Set<string> {
  const hidden: Set<string> = new Set();
  nodes
    .filter((node) => node.collapsed)
    .forEach((node) => {
      getDescendantNodeIds(node.id, edges).forEach((id) => {
        hidden.add(id);
      });
    });
  return hidden;
}

function buildBranchProgress(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number | null> {
  const nodeById: Map<string, GraphNode> = new Map(nodes.map((node) => [node.id, node]));
  const progress: Map<string, number | null> = new Map();

  nodes.forEach((node) => {
    const descendants = getDescendantNodeIds(node.id, edges);
    if (descendants.size === 0) {
      progress.set(node.id, null);
      return;
    }

    const completed = [...descendants].filter((childId) => nodeById.get(childId)?.completed).length;
    const percent = Math.round((completed / descendants.size) * 100);
    progress.set(node.id, percent);
  });

  return progress;
}

function GraphWorkspaceInner({ graph, todos, onGraphChange, onNotify, onJumpToTodo }: GraphWorkspaceProps) {
  const flow = useReactFlow();
  const importGraphRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const [defaultEdgeType, setDefaultEdgeType] = useState<GraphEdge['type']>('curved');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(28);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [exportName, setExportName] = useState('graph-export');
  const [exportScale, setExportScale] = useState(2);
  const [transparentExport, setTransparentExport] = useState(false);
  const [exportBackground, setExportBackground] = useState('#f4ede6');

  const [savedPositions, setSavedPositions] = useState<Record<string, NodePosition> | null>(null);

  const normalizedGraph = useMemo(() => normalizeGraph(graph), [graph]);
  const nodes = normalizedGraph.nodes;
  const edges = normalizedGraph.edges;

  const notify = useCallback(
    (type: NotifyKind, message: string) => {
      onNotify?.(type, message);
    },
    [onNotify]
  );

  const commitGraph = useCallback(
    (updater: GraphUpdater, options: GraphChangeOptions = { recordHistory: true }) => {
      onGraphChange?.((currentGraph: Graph) => {
        const current = normalizeGraph(currentGraph);
        const next = typeof updater === 'function' ? updater(current) : updater;
        return normalizeGraph(next);
      }, options);
    },
    [onGraphChange]
  );

  useEffect(() => {
    const validNodeIds: Set<string> = new Set(nodes.map((node) => node.id));
    const validEdgeIds: Set<string> = new Set(edges.map((edge) => edge.id));

    setSelectedNodeIds((prev) => prev.filter((id) => validNodeIds.has(id)));
    setSelectedEdgeIds((prev) => prev.filter((id) => validEdgeIds.has(id)));

    if (hoveredNodeId && !validNodeIds.has(hoveredNodeId)) {
      setHoveredNodeId(null);
    }
  }, [nodes, edges, hoveredNodeId]);

  const hiddenNodeIds = useMemo(() => collectHiddenNodeIds(nodes, edges), [nodes, edges]);

  const visibleNodes = useMemo(
    () => nodes.filter((node) => !hiddenNodeIds.has(node.id)),
    [nodes, hiddenNodeIds]
  );

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const visibleEdges = useMemo(
    () => edges.filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)),
    [edges, visibleNodeIds]
  );

  const connectionCounts = useMemo(() => {
    const counts: Map<string, number> = new Map(nodes.map((node) => [node.id, 0]));
    edges.forEach((edge) => {
      counts.set(edge.from, (counts.get(edge.from) || 0) + 1);
      counts.set(edge.to, (counts.get(edge.to) || 0) + 1);
    });
    return counts;
  }, [nodes, edges]);

  const branchProgress = useMemo(() => buildBranchProgress(nodes, edges), [nodes, edges]);

  const criticalPath = useMemo(() => {
    if (!showCriticalPath) {
      return { nodeIds: [], edgeIds: [] };
    }
    return computeCriticalPath(nodes, edges);
  }, [showCriticalPath, nodes, edges]);

  const criticalNodeIds = useMemo(() => new Set(criticalPath.nodeIds), [criticalPath.nodeIds]);
  const criticalEdgeIds = useMemo(() => new Set(criticalPath.edgeIds), [criticalPath.edgeIds]);

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
            ...(Array.isArray(node.tags) ? node.tags : [])
          ]
            .join(' ')
            .toLowerCase();
          return bucket.includes(query);
        })
        .map((node) => node.id)
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
        const searchMatch = searchMatches.size > 0 && searchMatches.has(node.id);

        return {
          id: node.id,
          type: 'graphNode',
          position: { x: node.x, y: node.y },
          selected: selectedNodeIds.includes(node.id),
          style: {
            width: dimensions.width,
            height: dimensions.height
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
                          status: !entry.completed ? 'done' : 'todo',
                          updatedAt: nowIso()
                        }
                      : entry
                  )
                }),
                { recordHistory: true }
              );
            },
            onRename: (nodeId: string) => {
              const target = nodes.find((entry) => entry.id === nodeId);
              if (!target) {
                return;
              }

              const nextLabel = window.prompt('Rename node', target.label);
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
                          updatedAt: nowIso()
                        }
                      : entry
                  )
                }),
                { recordHistory: true }
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
                  edges: [...prev.edges, edge]
                }),
                { recordHistory: true }
              );

              setSelectedNodeIds([child.id]);
              setSelectedEdgeIds([]);
              notify('success', 'Child node created.');
            }
          }
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
      notify
    ]
  );

  const flowEdges = useMemo(
    () =>
      visibleEdges.map((edge) => {
        const isCritical = criticalEdgeIds.has(edge.id);
        const isDimmed = focusMode && anchorNodeId && !(relatedSet.has(edge.from) && relatedSet.has(edge.to));

        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          type: graphEdgeTypeToFlow(edge.type),
          selected: selectedEdgeIds.includes(edge.id),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCritical ? '#9f3027' : '#7b5640'
          },
          style: {
            stroke: isCritical ? '#9f3027' : '#7b5640',
            strokeWidth: isCritical ? 2.8 : 2,
            opacity: isDimmed ? 0.2 : 0.92
          }
        };
      }),
    [visibleEdges, criticalEdgeIds, focusMode, anchorNodeId, relatedSet, selectedEdgeIds]
  );

  const activeNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeIds[0]) || null,
    [nodes, selectedNodeIds]
  );

  const selectedLinkedTodo = useMemo(
    () => todos.find((todo) => todo.id === activeNode?.todoId) || null,
    [todos, activeNode?.todoId]
  );

  const handleAddNodeAtCenter = useCallback(() => {
    const viewport = flow.getViewport();
    const defaultX = Number.isFinite(viewport.x) ? -viewport.x + 160 : 120;
    const defaultY = Number.isFinite(viewport.y) ? -viewport.y + 120 : 120;

    const node = createNode(`Node ${nodes.length + 1}`);
    const snappedX = snapToGrid ? Math.round(defaultX / gridSize) * gridSize : defaultX;
    const snappedY = snapToGrid ? Math.round(defaultY / gridSize) * gridSize : defaultY;
    node.x = snappedX;
    node.y = snappedY;

    commitGraph(
      (prev) => ({
        ...prev,
        nodes: [...prev.nodes, node]
      }),
      { recordHistory: true }
    );

    setSelectedNodeIds([node.id]);
    setSelectedEdgeIds([]);
    notify('success', 'Node added.');
  }, [flow, nodes.length, snapToGrid, gridSize, commitGraph, notify]);

  const handlePaneDoubleClick = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const point = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const node = createNode(`Node ${nodes.length + 1}`);
      node.x = snapToGrid ? Math.round(point.x / gridSize) * gridSize : point.x;
      node.y = snapToGrid ? Math.round(point.y / gridSize) * gridSize : point.y;

      commitGraph(
        (prev) => ({
          ...prev,
          nodes: [...prev.nodes, node]
        }),
        { recordHistory: true }
      );

      setSelectedNodeIds([node.id]);
      setSelectedEdgeIds([]);
    },
    [flow, nodes.length, snapToGrid, gridSize, commitGraph]
  );

  const handleDeleteSelection = useCallback(() => {
    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) {
      return;
    }

    const nodeSet: Set<string> = new Set(selectedNodeIds);
    const edgeSet: Set<string> = new Set(selectedEdgeIds);

    commitGraph(
      (prev) => ({
        ...prev,
        nodes: prev.nodes.filter((node) => !nodeSet.has(node.id)),
        edges: prev.edges.filter(
          (edge) => !edgeSet.has(edge.id) && !nodeSet.has(edge.from) && !nodeSet.has(edge.to)
        )
      }),
      { recordHistory: true }
    );

    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    notify('success', 'Selection deleted.');
  }, [selectedNodeIds, selectedEdgeIds, commitGraph, notify]);

  const handleDuplicateSelection = useCallback(() => {
    if (selectedNodeIds.length === 0) {
      notify('warning', 'Select at least one node to duplicate.');
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
          updatedAt: nowIso()
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
          id: createEdge('', '').id,
          from,
          to,
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
      })
      .filter((edge): edge is GraphEdge => edge !== null);

    commitGraph(
      (prev) => ({
        ...prev,
        nodes: [...prev.nodes, ...clones],
        edges: [...prev.edges, ...clonedEdges]
      }),
      { recordHistory: true }
    );

    setSelectedNodeIds(clones.map((node) => node.id));
    setSelectedEdgeIds([]);
    notify('success', `Duplicated ${clones.length} node(s).`);
  }, [selectedNodeIds, nodes, edges, commitGraph, notify]);

  const handleDuplicateSubtree = useCallback(() => {
    const rootId = selectedNodeIds[0];
    if (!rootId) {
      notify('warning', 'Select a root node first.');
      return;
    }

    commitGraph(
      (prev) => duplicateSubtree(prev.nodes, prev.edges, rootId),
      { recordHistory: true }
    );

    notify('success', 'Subtree duplicated.');
  }, [selectedNodeIds, commitGraph, notify]);

  const handleConnect = useCallback(
    (params: ConnectParams) => {
      const source = params.source;
      const target = params.target;

      if (!source || !target) {
        return;
      }

      if (source === target) {
        notify('warning', 'Cannot connect a node to itself.');
        return;
      }

      if (wouldCreateCycle(edges, source, target)) {
        notify('error', 'Connection rejected to prevent a circular dependency.');
        return;
      }

      const duplicate = edges.some((edge) => edge.from === source && edge.to === target);
      if (duplicate) {
        notify('warning', 'That connection already exists.');
        return;
      }

      const edge = createEdge(source, target);
      edge.type = defaultEdgeType;

      commitGraph(
        (prev) => ({
          ...prev,
          edges: [...prev.edges, edge]
        }),
        { recordHistory: true }
      );
    },
    [edges, defaultEdgeType, commitGraph, notify]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChangeLike[]) => {
      const positionUpdates = changes.filter((change) => change.type === 'position' && change.position);
      const removals = changes.filter((change) => change.type === 'remove');

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
                  (change): change is NodeChangeLike & { id: string; position: NodePosition } =>
                    typeof change.id === 'string' && Boolean(change.position)
                )
                .map((change) => [change.id, change.position])
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
                updatedAt: nowIso()
              };
            });
          }

          if (removals.length > 0) {
            const ids: Set<string> = new Set(
              removals
                .map((change) => change.id)
                .filter((id): id is string => typeof id === 'string')
            );
            nextNodes = nextNodes.filter((node) => !ids.has(node.id));
            nextEdges = nextEdges.filter((edge) => !ids.has(edge.from) && !ids.has(edge.to));
          }

          return {
            ...prev,
            nodes: nextNodes,
            edges: nextEdges
          };
        },
        { recordHistory: false }
      );
    },
    [commitGraph]
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
                  updatedAt: nowIso()
                }
              : entry
          )
        }),
        { recordHistory: true }
      );
    },
    [commitGraph]
  );

  const handleEdgesChange = useCallback(
    (changes: NodeChangeLike[]) => {
      const removals = changes.filter((change) => change.type === 'remove');
      if (removals.length === 0) {
        return;
      }

      const ids: Set<string> = new Set(
        removals
          .map((change) => change.id)
          .filter((id): id is string => typeof id === 'string')
      );
      commitGraph(
        (prev) => ({
          ...prev,
          edges: prev.edges.filter((edge) => !ids.has(edge.id))
        }),
        { recordHistory: true }
      );
    },
    [commitGraph]
  );

  const handleSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: SelectionChangeLike) => {
    setSelectedNodeIds(selectedNodes.map((node) => node.id));
    setSelectedEdgeIds(selectedEdges.map((edge) => edge.id));
  }, []);

  const applyEdgeType = useCallback(
    (type: GraphEdge['type']) => {
      if (selectedEdgeIds.length === 0) {
        setDefaultEdgeType(type);
        notify('success', `New connections will use ${type} style.`);
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
                  updatedAt: nowIso()
                }
              : edge
          )
        }),
        { recordHistory: true }
      );

      notify('success', 'Edge style updated for selection.');
    },
    [selectedEdgeIds, commitGraph, notify]
  );

  const alignSelected = useCallback(
    (mode: AlignMode) => {
      const selected = nodes.filter((node) => selectedNodeIds.includes(node.id));
      if (selected.length < 2) {
        notify('warning', 'Select at least two nodes to align.');
        return;
      }

      const dimensions: Map<string, { width: number; height: number }> = new Map(
        selected.map((node) => [node.id, nodeSizeToDimensions(node.size)])
      );
      const centersX = selected.map((node) => node.x + (dimensions.get(node.id)?.width || 0) / 2);
      const centersY = selected.map((node) => node.y + (dimensions.get(node.id)?.height || 0) / 2);

      const minX = Math.min(...selected.map((node) => node.x));
      const maxX = Math.max(
        ...selected.map((node) => node.x + (dimensions.get(node.id)?.width || 0))
      );
      const minY = Math.min(...selected.map((node) => node.y));
      const maxY = Math.max(
        ...selected.map((node) => node.y + (dimensions.get(node.id)?.height || 0))
      );

      const targetCenterX = centersX.reduce((sum, value) => sum + value, 0) / centersX.length;
      const targetCenterY = centersY.reduce((sum, value) => sum + value, 0) / centersY.length;

      const selectedSet: Set<string> = new Set(selectedNodeIds);
      commitGraph(
        (prev) => ({
          ...prev,
          nodes: prev.nodes.map((node) => {
            if (!selectedSet.has(node.id)) {
              return node;
            }

            const size = nodeSizeToDimensions(node.size);
            if (mode === 'left') {
              return { ...node, x: minX, updatedAt: nowIso() };
            }
            if (mode === 'right') {
              return { ...node, x: maxX - size.width, updatedAt: nowIso() };
            }
            if (mode === 'hcenter') {
              return { ...node, x: targetCenterX - size.width / 2, updatedAt: nowIso() };
            }
            if (mode === 'top') {
              return { ...node, y: minY, updatedAt: nowIso() };
            }
            if (mode === 'bottom') {
              return { ...node, y: maxY - size.height, updatedAt: nowIso() };
            }
            if (mode === 'vcenter') {
              return { ...node, y: targetCenterY - size.height / 2, updatedAt: nowIso() };
            }
            return node;
          })
        }),
        { recordHistory: true }
      );
    },
    [nodes, selectedNodeIds, commitGraph, notify]
  );

  const handleAutoLayout = useCallback(
    (kind: LayoutKind) => {
      commitGraph(
        (prev) => ({
          ...prev,
          nodes:
            kind === 'force'
              ? autoLayoutForce(prev.nodes, prev.edges)
              : autoLayoutHierarchical(prev.nodes, prev.edges)
        }),
        { recordHistory: true }
      );

      window.requestAnimationFrame(() => {
        flow.fitView({ padding: 0.2, duration: 360 });
      });
    },
    [commitGraph, flow]
  );

  const handleResetPositions = useCallback(() => {
    commitGraph(
      (prev) => ({
        ...prev,
        nodes: arrangeNodesGrid(prev.nodes, 4)
      }),
      { recordHistory: true }
    );

    window.requestAnimationFrame(() => {
      flow.fitView({ padding: 0.18, duration: 320 });
    });
  }, [commitGraph, flow]);

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

  const handleToggleCollapse = useCallback(() => {
    const nodeId = selectedNodeIds[0];
    if (!nodeId) {
      notify('warning', 'Select a node to collapse or expand.');
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
                updatedAt: nowIso()
              }
            : node
        )
      }),
      { recordHistory: true }
    );
  }, [selectedNodeIds, commitGraph, notify]);

  const handleSelectAll = useCallback(() => {
    setSelectedNodeIds(visibleNodes.map((node) => node.id));
    setSelectedEdgeIds([]);
  }, [visibleNodes]);

  const handleClearSelection = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, []);

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
      flow.setCenter(node.x + size.width / 2, node.y + size.height / 2, { zoom: 1.15, duration: 360 });
    },
    [nodes, flow]
  );

  const handleFindFirstMatch = useCallback(() => {
    const firstMatchId = [...searchMatches][0] || null;
    if (!firstMatchId) {
      notify('warning', 'No node matches the current search.');
      return;
    }

    setSelectedNodeIds([firstMatchId]);
    setSelectedEdgeIds([]);
    handleCenterOnNode(firstMatchId);
  }, [searchMatches, handleCenterOnNode, notify]);

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
                  updatedAt: nowIso()
                }
              : node
          )
        }),
        { recordHistory: true }
      );
    },
    [selectedNodeIds, commitGraph]
  );

  const handleClearGraph = useCallback(() => {
    if (nodes.length === 0) {
      return;
    }

    const confirmed = window.confirm('Clear all nodes and connections in graph mode?');
    if (!confirmed) {
      return;
    }

    commitGraph(
      {
        nodes: [],
        edges: []
      },
      { recordHistory: true }
    );

    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    notify('success', 'Graph cleared.');
  }, [nodes.length, commitGraph, notify]);

  const handleExportGraphJson = useCallback(() => {
    const payload = JSON.stringify({ nodes, edges }, null, 2);
    createDownload(`${exportName || 'graph-export'}.graph.json`, payload, 'application/json;charset=utf-8');
    notify('success', 'Graph exported as JSON.');
  }, [nodes, edges, exportName, notify]);

  const handleImportGraph = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
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
        notify('warning', 'Imported graph file had no nodes.');
        event.target.value = '';
        return;
      }

      const replace = window.confirm('Replace current graph? Click Cancel to merge.');

      if (replace) {
        commitGraph(incoming, { recordHistory: true });
      } else {
        const existingNodeIds: Set<string> = new Set(nodes.map((node) => node.id));
        const existingEdgeIds: Set<string> = new Set(edges.map((edge) => edge.id));
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
            updatedAt: nowIso()
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
              nextEdgeId = createEdge('', '').id;
            }
            existingEdgeIds.add(nextEdgeId);

            return {
              ...edge,
              id: nextEdgeId,
              from,
              to,
              createdAt: nowIso(),
              updatedAt: nowIso()
            };
          })
          .filter((edge): edge is GraphEdge => edge !== null);

        commitGraph(
          (prev) => ({
            nodes: [...prev.nodes, ...remappedNodes],
            edges: [...prev.edges, ...remappedEdges]
          }),
          { recordHistory: true }
        );
      }

      notify('success', `Imported ${incoming.nodes.length} node(s).`);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Graph import failed.');
    } finally {
      event.target.value = '';
    }
  }, [commitGraph, notify]);

  const handleExportSvg = useCallback(() => {
    const svg = graphToSvg(nodes, edges, { title: exportName || 'Graph Export' });
    createDownload(`${exportName || 'graph-export'}.svg`, svg, 'image/svg+xml;charset=utf-8');
    notify('success', 'Graph exported as SVG.');
  }, [nodes, edges, exportName, notify]);

  const captureCanvas = useCallback(async (format: ExportImageFormat) => {
    const target = canvasRef.current?.querySelector('.react-flow__viewport');
    if (!target) {
      throw new Error('Graph viewport not found for export.');
    }
    if (!(target instanceof HTMLElement)) {
      throw new Error('Graph viewport is not an HTML element.');
    }

    const config: {
      pixelRatio: number;
      cacheBust: boolean;
      backgroundColor: string;
    } = {
      pixelRatio: clamp(exportScale, 1, 5),
      cacheBust: true,
      backgroundColor: transparentExport ? 'transparent' : exportBackground
    };

    if (format === 'jpg') {
      return toJpeg(target, {
        ...config,
        quality: 0.92,
        backgroundColor: transparentExport ? '#ffffff' : exportBackground
      });
    }

    return toPng(target, config);
  }, [exportScale, transparentExport, exportBackground]);

  const handleExportImage = useCallback(async (format: ExportImageFormat) => {
    try {
      const dataUrl = await captureCanvas(format);
      downloadFromDataUrl(`${exportName || 'graph-export'}.${format}`, dataUrl);
      notify('success', `Graph exported as ${format.toUpperCase()}.`);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Image export failed.');
    }
  }, [captureCanvas, exportName, notify]);

  const handleExportPdf = useCallback(async () => {
    try {
      const dataUrl = await captureCanvas('png');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(12);
      doc.text(exportName || 'Graph Export', 34, 26);

      const availableWidth = pageWidth - 68;
      const availableHeight = pageHeight - 64;
      doc.addImage(dataUrl, 'PNG', 34, 34, availableWidth, availableHeight);

      doc.setFontSize(9);
      doc.text(`Exported ${new Date().toLocaleString()}`, 34, pageHeight - 14);
      doc.save(`${exportName || 'graph-export'}.pdf`);
      notify('success', 'Graph exported as PDF.');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'PDF export failed.');
    }
  }, [captureCanvas, exportName, notify]);

  const handlePrintGraph = useCallback(() => {
    const svg = graphToSvg(nodes, edges, { title: exportName || 'Graph Export' });
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1220,height=940');

    if (!printWindow) {
      notify('error', 'Popup blocked. Enable popups to print graph.');
      return;
    }

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${exportName || 'Graph Export'}</title>
    <style>
      body { margin: 0; padding: 24px; font-family: Georgia, serif; background: #f4ede6; }
      svg { width: 100%; height: auto; border: 1px solid #ccb7a7; background: #f4ede6; }
    </style>
  </head>
  <body>
    ${svg}
    <script>
      window.onload = function() {
        window.focus();
        window.print();
      };
    </script>
  </body>
</html>`);
    printWindow.document.close();
  }, [nodes, edges, exportName, notify]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isInputLikeTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeIds.length + selectedEdgeIds.length > 0) {
        event.preventDefault();
        handleDeleteSelection();
        return;
      }

      if (isMod && key === 'a') {
        event.preventDefault();
        handleSelectAll();
        return;
      }

      if (isMod && key === 'd') {
        event.preventDefault();
        handleDuplicateSelection();
        return;
      }

      if (isMod && key === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (key === 'escape') {
        event.preventDefault();
        handleClearSelection();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    selectedNodeIds.length,
    selectedEdgeIds.length,
    handleDeleteSelection,
    handleSelectAll,
    handleDuplicateSelection,
    handleClearSelection
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

      <section className="panel graph-toolbar-panel">
        <div className="graph-toolbar-row">
          <div className="graph-tool-group">
            <button type="button" className="secondary-button" onClick={handleAddNodeAtCenter}>
              <Sparkles size={14} /> Add node
            </button>
            <button type="button" className="secondary-button" onClick={handleDuplicateSelection}>
              <CopyPlus size={14} /> Duplicate
            </button>
            <button type="button" className="secondary-button" onClick={handleDuplicateSubtree}>
              <Workflow size={14} /> Duplicate subtree
            </button>
            <button type="button" className="danger-button" onClick={handleDeleteSelection}>
              <Trash2 size={14} /> Delete selected
            </button>
          </div>

          <div className="graph-tool-group">
            <button type="button" className="secondary-button" onClick={handleSelectAll}>
              <BringToFront size={14} /> Select all
            </button>
            <button type="button" className="secondary-button" onClick={handleClearSelection}>
              <Minimize size={14} /> Deselect
            </button>
            <button type="button" className="secondary-button" onClick={handleToggleCollapse}>
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
                onChange={(event) => setDefaultEdgeType(event.target.value as GraphEdge['type'])}
              >
                {EDGE_TYPES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="secondary-button" onClick={() => applyEdgeType(defaultEdgeType)}>
              <Link2 size={14} /> Apply edge style
            </button>

            <label>
              Grid size
              <input
                type="number"
                min={8}
                max={120}
                value={gridSize}
                onChange={(event) => setGridSize(clamp(Number(event.target.value) || 28, 8, 120))}
              />
            </label>

            <label className="inline-toggle">
              <input type="checkbox" checked={snapToGrid} onChange={(event) => setSnapToGrid(event.target.checked)} />
              <span>Snap to grid</span>
            </label>

            <label className="inline-toggle">
              <input type="checkbox" checked={showMiniMap} onChange={(event) => setShowMiniMap(event.target.checked)} />
              <span>Minimap</span>
            </label>

            <label className="inline-toggle">
              <input type="checkbox" checked={focusMode} onChange={(event) => setFocusMode(event.target.checked)} />
              <span>Focus mode</span>
            </label>

            <label className="inline-toggle">
              <input
                type="checkbox"
                checked={showCriticalPath}
                onChange={(event) => setShowCriticalPath(event.target.checked)}
              />
              <span>Critical path</span>
            </label>
          </div>
        </div>

        <div className="graph-toolbar-row">
          <div className="graph-tool-group">
            <button type="button" className="secondary-button" onClick={() => alignSelected('left')}>
              <AlignCenterVertical size={14} /> Align left
            </button>
            <button type="button" className="secondary-button" onClick={() => alignSelected('right')}>
              <AlignCenterVertical size={14} /> Align right
            </button>
            <button type="button" className="secondary-button" onClick={() => alignSelected('hcenter')}>
              <AlignHorizontalJustifyCenter size={14} /> Align center
            </button>
            <button type="button" className="secondary-button" onClick={() => alignSelected('top')}>
              <AlignCenterVertical size={14} /> Align top
            </button>
            <button type="button" className="secondary-button" onClick={() => alignSelected('bottom')}>
              <AlignCenterVertical size={14} /> Align bottom
            </button>
            <button type="button" className="secondary-button" onClick={() => alignSelected('vcenter')}>
              <AlignVerticalJustifyCenter size={14} /> Align middle
            </button>
          </div>
        </div>

        <div className="graph-toolbar-row">
          <div className="graph-tool-group">
            <button type="button" className="secondary-button" onClick={() => handleAutoLayout('hierarchical')}>
              <Workflow size={14} /> Auto-layout (hierarchy)
            </button>
            <button type="button" className="secondary-button" onClick={() => handleAutoLayout('force')}>
              <Sparkles size={14} /> Auto-layout (force)
            </button>
            <button type="button" className="secondary-button" onClick={handleResetPositions}>
              <Grid2x2 size={14} /> Reset positions
            </button>
            <button type="button" className="secondary-button" onClick={handleSavePositions}>
              <FileDown size={14} /> Save positions
            </button>
            <button type="button" className="secondary-button" onClick={handleLoadPositions}>
              <FileUp size={14} /> Load positions
            </button>
            <button type="button" className="secondary-button" onClick={handleFitView}>
              <Maximize size={14} /> Fit graph
            </button>
            <button type="button" className="secondary-button" onClick={handleResetView}>
              <RotateCcw size={14} /> Reset view
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                if (selectedNodeIds[0]) {
                  handleCenterOnNode(selectedNodeIds[0]);
                }
              }}
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
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Find nodes by name, tag, description"
            />
            <button type="button" className="secondary-button" onClick={handleFindFirstMatch}>
              Find next
            </button>
          </div>

          <div className="graph-tool-group">
            <input
              value={exportName}
              onChange={(event) => setExportName(event.target.value)}
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
                onChange={(event) => setExportScale(clamp(Number(event.target.value) || 2, 1, 5))}
              />
            </label>
            <label className="inline-toggle">
              <input
                type="checkbox"
                checked={transparentExport}
                onChange={(event) => setTransparentExport(event.target.checked)}
              />
              <span>Transparent export</span>
            </label>
            <input
              type="color"
              value={exportBackground}
              onChange={(event) => setExportBackground(event.target.value)}
              title="Export background"
            />
            <button type="button" className="secondary-button" onClick={handleExportGraphJson}>
              <FileJson size={14} /> Graph JSON
            </button>
            <button type="button" className="secondary-button" onClick={() => importGraphRef.current?.click()}>
              <FileUp size={14} /> Import graph
            </button>
            <button type="button" className="secondary-button" onClick={handleExportSvg}>
              <FileDown size={14} /> SVG
            </button>
            <button type="button" className="secondary-button" onClick={() => void handleExportImage('png')}>
              <FileImage size={14} /> PNG
            </button>
            <button type="button" className="secondary-button" onClick={() => void handleExportImage('jpg')}>
              <FileImage size={14} /> JPG
            </button>
            <button type="button" className="secondary-button" onClick={() => void handleExportPdf()}>
              <FileDown size={14} /> PDF
            </button>
            <button type="button" className="secondary-button" onClick={handlePrintGraph}>
              <FileDown size={14} /> Print
            </button>
            <button type="button" className="danger-button" onClick={handleClearGraph}>
              <Trash2 size={14} /> Clear graph
            </button>
          </div>
        </div>
      </section>

      <div className="panel graph-canvas-panel" ref={canvasRef}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={NODE_TYPES}
          onNodesChange={handleNodesChange}
          onNodeDragStop={handleNodeDragStop}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onSelectionChange={handleSelectionChange}
          onPaneClick={(event) => {
            if (event?.detail === 2) {
              handlePaneDoubleClick(event);
            }
          }}
          onNodeMouseEnter={(_event, node: FlowNodeLike) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          snapToGrid={snapToGrid}
          snapGrid={[gridSize, gridSize]}
          deleteKeyCode={null}
          panOnDrag
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={gridSize} size={1} variant={BackgroundVariant.Lines} color="var(--line)" />
          <Controls />
          {showMiniMap && (
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => {
                const matched = searchMatches.has(node.id);
                if (matched) {
                  return '#9f3027';
                }
                return typeof node.data?.color === 'string' ? node.data.color : '#b08968';
              }}
            />
          )}
        </ReactFlow>
      </div>

      <section className="panel graph-inspector-panel">
        <h3>Graph Inspector</h3>
        <p className="meta-line">
          {nodes.length} nodes, {edges.length} connections, {selectedNodeIds.length} selected node(s),{' '}
          {selectedEdgeIds.length} selected edge(s)
        </p>

        {activeNode ? (
          <div className="graph-editor-form">
            <div className="inspector-row two">
              <label>
                Label
                <input
                  value={activeNode.label}
                  onChange={(event) => handlePatchActiveNode({ label: event.target.value || activeNode.label })}
                />
              </label>
              <label>
                Icon/emoji
                <input
                  value={activeNode.icon || ''}
                  onChange={(event) => handlePatchActiveNode({ icon: event.target.value.slice(0, 2) || '◉' })}
                />
              </label>
            </div>

            <label>
              Description
              <textarea
                rows={3}
                value={activeNode.description || ''}
                onChange={(event) => handlePatchActiveNode({ description: event.target.value })}
              />
            </label>

            <div className="inspector-row two">
              <label>
                Shape
                <select
                  value={activeNode.shape}
                  onChange={(event) => handlePatchActiveNode({ shape: event.target.value as GraphNode['shape'] })}
                >
                  {SHAPES.map((shape) => (
                    <option key={shape} value={shape}>
                      {shape}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Size
                <select
                  value={activeNode.size}
                  onChange={(event) => handlePatchActiveNode({ size: event.target.value as GraphNode['size'] })}
                >
                  {SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="inspector-row two">
              <label>
                Priority
                <select
                  value={activeNode.priority}
                  onChange={(event) =>
                    handlePatchActiveNode({ priority: event.target.value as GraphNode['priority'] })
                  }
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={activeNode.status}
                  onChange={(event) => handlePatchActiveNode({ status: event.target.value as GraphNode['status'] })}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="inspector-row three">
              <label>
                Fill
                <input
                  type="color"
                  value={activeNode.color}
                  onChange={(event) => handlePatchActiveNode({ color: event.target.value })}
                />
              </label>
              <label>
                Text
                <input
                  type="color"
                  value={activeNode.textColor}
                  onChange={(event) => handlePatchActiveNode({ textColor: event.target.value })}
                />
              </label>
              <label>
                Border
                <input
                  type="color"
                  value={activeNode.borderColor}
                  onChange={(event) => handlePatchActiveNode({ borderColor: event.target.value })}
                />
              </label>
            </div>

            <label>
              Opacity
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={activeNode.opacity ?? 1}
                onChange={(event) => handlePatchActiveNode({ opacity: Number(event.target.value) })}
              />
            </label>

            <div className="inspector-row two">
              <label>
                Alias
                <input
                  value={activeNode.alias || ''}
                  onChange={(event) => handlePatchActiveNode({ alias: event.target.value })}
                />
              </label>
              <label>
                Owner
                <input
                  value={activeNode.owner || ''}
                  onChange={(event) => handlePatchActiveNode({ owner: event.target.value })}
                />
              </label>
            </div>

            <label>
              Tags
              <input
                value={(activeNode.tags || []).join(', ')}
                onChange={(event) => handlePatchActiveNode({ tags: parseTags(event.target.value) })}
                placeholder="planning, release"
              />
            </label>

            <label>
              Link to todo
              <select
                value={activeNode.todoId || ''}
                onChange={(event) => handlePatchActiveNode({ todoId: event.target.value || null })}
              >
                <option value="">None</option>
                {todos.map((todo) => (
                  <option key={todo.id} value={todo.id}>
                    {todo.text}
                  </option>
                ))}
              </select>
            </label>

            <div className="inline-row">
              <label className="inline-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(activeNode.completed)}
                  onChange={(event) => handlePatchActiveNode({ completed: event.target.checked })}
                />
                <span>Completed</span>
              </label>

              <label className="inline-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(activeNode.collapsed)}
                  onChange={(event) => handlePatchActiveNode({ collapsed: event.target.checked })}
                />
                <span>Collapsed</span>
              </label>

              <label className="inline-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(activeNode.shadow)}
                  onChange={(event) => handlePatchActiveNode({ shadow: event.target.checked })}
                />
                <span>Shadow</span>
              </label>
            </div>

            <div className="inline-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const descendants = getDescendantNodeIds(activeNode.id, edges);
                  notify('success', `${descendants.size} downstream node(s) in this branch.`);
                }}
              >
                <Network size={14} /> Branch stats
              </button>
              {selectedLinkedTodo && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onJumpToTodo?.(selectedLinkedTodo.id)}
                >
                  <Focus size={14} /> Open linked todo
                </button>
              )}
              <button type="button" className="secondary-button" onClick={() => handleCenterOnNode(activeNode.id)}>
                <Focus size={14} /> Center on node
              </button>
            </div>

            <p className="meta-line">
              Created: {new Date(activeNode.createdAt).toLocaleString()} · Updated: {new Date(activeNode.updatedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="meta-line">
            Select a node to edit shape, metadata, colors, links, and branch controls.
          </p>
        )}
      </section>
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
