import type { GraphEdge, GraphNode, Todo } from '../../../lib/workspace';
import GraphNodeCard from '../GraphNodeCard';
import type { EdgeTypeOption } from './types';

export const NODE_TYPES = {
  graphNode: GraphNodeCard
};

export const EDGE_TYPES: EdgeTypeOption[] = [
  { value: 'curved', label: 'Curved' },
  { value: 'straight', label: 'Straight' },
  { value: 'orthogonal', label: 'Orthogonal' }
];

export const SHAPES: GraphNode['shape'][] = ['square', 'circle', 'diamond', 'pill'];
export const SIZES: GraphNode['size'][] = ['sm', 'md', 'lg'];
export const PRIORITIES: Todo['priority'][] = ['low', 'medium', 'high', 'critical'];
export const STATUSES: Todo['status'][] = ['todo', 'doing', 'done', 'blocked'];

export const DEFAULT_EDGE_TYPE: GraphEdge['type'] = 'curved';