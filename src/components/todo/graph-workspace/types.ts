import type { Graph, GraphEdge, Todo } from '../../../lib/workspace';

export type NotifyKind = 'success' | 'warning' | 'error';
export type AlignMode = 'left' | 'right' | 'hcenter' | 'top' | 'bottom' | 'vcenter';
export type LayoutKind = 'hierarchical' | 'force';
export type ExportImageFormat = 'png' | 'jpg';

export interface GraphChangeOptions {
  recordHistory?: boolean;
}

export type GraphUpdater = Graph | ((currentGraph: Graph) => Graph);

export interface GraphWorkspaceProps {
  graph: Graph | unknown;
  todos: Todo[];
  onGraphChange?: (nextGraphOrUpdater: GraphUpdater, options?: GraphChangeOptions) => void;
  onNotify?: (type: NotifyKind, message: string) => void;
  onJumpToTodo?: (todoId: string) => void;
}

export interface EdgeTypeOption {
  value: GraphEdge['type'];
  label: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeChangeLike {
  id?: string;
  type: string;
  position?: NodePosition;
}

export interface SelectionChangeLike {
  nodes: Array<{ id: string }>;
  edges: Array<{ id: string }>;
}

export interface ConnectParams {
  source: string | null;
  target: string | null;
}

export interface FlowNodeLike {
  id: string;
  position: NodePosition;
  data?: {
    color?: string;
  };
}