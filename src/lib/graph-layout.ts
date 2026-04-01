import dagre from 'dagre';
import { createEdge, createNode, makeId } from './workspace';

const NODE_SIZES = {
  sm: { width: 152, height: 74 },
  md: { width: 198, height: 96 },
  lg: { width: 246, height: 118 }
};

const EDGE_TYPES = new Set(['curved', 'straight', 'orthogonal']);

function nowIso() {
  return new Date().toISOString();
}

/**
 * @param {'sm'|'md'|'lg'} [size] - Graph node size token.
 * @returns {{width:number,height:number}} Pixel dimensions used by layout/rendering.
 */
export function nodeSizeToDimensions(size = 'md') {
  return NODE_SIZES[size] || NODE_SIZES.md;
}

/**
 * @param {object} graph - Candidate graph payload with `nodes` and `edges` arrays.
 * @returns {{nodes:Array<object>, edges:Array<object>}} Sanitized graph structure.
 */
export function normalizeGraph(graph) {
  const base = graph && typeof graph === 'object' ? graph : { nodes: [], edges: [] };

  const nodes = (Array.isArray(base.nodes) ? base.nodes : [])
    .filter((node) => node && typeof node === 'object')
    .map((node, index) => {
      const built = createNode(typeof node.label === 'string' ? node.label : `Node ${index + 1}`);
      return {
        ...built,
        ...node,
        id: typeof node.id === 'string' ? node.id : makeId('node'),
        label: typeof node.label === 'string' && node.label.trim() ? node.label.trim() : `Node ${index + 1}`,
        shape: ['circle', 'square', 'diamond', 'pill'].includes(node.shape) ? node.shape : 'square',
        size: ['sm', 'md', 'lg'].includes(node.size) ? node.size : 'md',
        color: typeof node.color === 'string' && node.color.trim() ? node.color : built.color,
        textColor: typeof node.textColor === 'string' && node.textColor.trim() ? node.textColor : built.textColor,
        borderColor: typeof node.borderColor === 'string' && node.borderColor.trim() ? node.borderColor : built.borderColor,
        x: Number.isFinite(node.x) ? Number(node.x) : 0,
        y: Number.isFinite(node.y) ? Number(node.y) : 0,
        tags: Array.isArray(node.tags) ? node.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
        opacity: Number.isFinite(node.opacity) ? Math.max(0.15, Math.min(1, Number(node.opacity))) : 1,
        collapsed: Boolean(node.collapsed),
        completed: Boolean(node.completed),
        createdAt: typeof node.createdAt === 'string' ? node.createdAt : nowIso(),
        updatedAt: typeof node.updatedAt === 'string' ? node.updatedAt : nowIso()
      };
    });

  const nodeIds = new Set(nodes.map((node) => node.id));

  const edges = (Array.isArray(base.edges) ? base.edges : [])
    .filter((edge) => edge && typeof edge === 'object')
    .map((edge) => {
      const from = typeof edge.from === 'string' ? edge.from : typeof edge.source === 'string' ? edge.source : '';
      const to = typeof edge.to === 'string' ? edge.to : typeof edge.target === 'string' ? edge.target : '';
      return {
        ...createEdge(from, to),
        ...edge,
        id: typeof edge.id === 'string' ? edge.id : makeId('edge'),
        from,
        to,
        type: EDGE_TYPES.has(edge.type) ? edge.type : 'curved',
        createdAt: typeof edge.createdAt === 'string' ? edge.createdAt : nowIso(),
        updatedAt: typeof edge.updatedAt === 'string' ? edge.updatedAt : nowIso()
      };
    })
    .filter((edge) => edge.from && edge.to && nodeIds.has(edge.from) && nodeIds.has(edge.to));

  return { nodes, edges };
}

/**
 * @param {string} type - Internal graph edge type.
 * @returns {'smoothstep'|'straight'|'step'} React Flow edge type.
 */
export function graphEdgeTypeToFlow(type) {
  if (type === 'straight') {
    return 'straight';
  }
  if (type === 'orthogonal') {
    return 'step';
  }
  return 'smoothstep';
}

/**
 * @param {string} type - React Flow edge type.
 * @returns {'curved'|'straight'|'orthogonal'} Internal graph edge type.
 */
export function flowEdgeTypeToGraph(type) {
  if (type === 'straight') {
    return 'straight';
  }
  if (type === 'step') {
    return 'orthogonal';
  }
  return 'curved';
}

function hasPath(adjacency, start, goal) {
  if (start === goal) {
    return true;
  }

  const visited = new Set();
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    if (current === goal) {
      return true;
    }

    visited.add(current);
    const neighbors = adjacency.get(current) || [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }

  return false;
}

/**
 * @param {Array<object>} edges - Current edge collection containing `from` and `to` node ids.
 * @param {string} from - Source node id for the candidate edge.
 * @param {string} to - Target node id for the candidate edge.
 * @returns {boolean} True when adding the edge would create a cycle.
 */
export function wouldCreateCycle(edges, from, to) {
  if (!from || !to) {
    return false;
  }
  if (from === to) {
    return true;
  }

  const adjacency = new Map();
  edges.forEach((edge) => {
    const list = adjacency.get(edge.from) || [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
  });

  const seed = adjacency.get(from) || [];
  adjacency.set(from, [...seed, to]);

  return hasPath(adjacency, to, from);
}

/**
 * @param {Array<object>} nodes - Graph nodes.
 * @param {number} [columns] - Grid columns count.
 * @returns {Array<object>} Nodes with recalculated x/y positions.
 */
export function arrangeNodesGrid(nodes, columns = 4) {
  const safeColumns = Math.max(1, Number(columns) || 4);
  return nodes.map((node, index) => {
    const size = nodeSizeToDimensions(node.size);
    return {
      ...node,
      x: (index % safeColumns) * (size.width + 52),
      y: Math.floor(index / safeColumns) * (size.height + 56),
      updatedAt: nowIso()
    };
  });
}

/**
 * @param {Array<object>} nodes - Graph nodes.
 * @param {Array<object>} edges - Graph edges.
 * @returns {Array<object>} Node list with dagre hierarchical positions.
 */
export function autoLayoutHierarchical(nodes, edges) {
  if (nodes.length === 0) {
    return [];
  }

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: 'LR', ranksep: 72, nodesep: 48, marginx: 30, marginy: 30 });
  graph.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const size = nodeSizeToDimensions(node.size);
    graph.setNode(node.id, { width: size.width, height: size.height });
  });

  edges.forEach((edge) => {
    if (edge.from && edge.to) {
      graph.setEdge(edge.from, edge.to);
    }
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const positioned = graph.node(node.id);
    const size = nodeSizeToDimensions(node.size);
    if (!positioned) {
      return node;
    }

    return {
      ...node,
      x: Math.round(positioned.x - size.width / 2),
      y: Math.round(positioned.y - size.height / 2),
      updatedAt: nowIso()
    };
  });
}

/**
 * @param {Array<object>} nodes - Graph nodes.
 * @param {Array<object>} edges - Graph edges.
 * @param {number} [iterations] - Force simulation iterations.
 * @returns {Array<object>} Node list with force-directed positions.
 */
export function autoLayoutForce(nodes, edges, iterations = 260) {
  if (nodes.length === 0) {
    return [];
  }

  const positions = new Map(nodes.map((node, index) => [node.id, { x: node.x || index * 24, y: node.y || index * 18 }]));
  const velocity = new Map(nodes.map((node) => [node.id, { x: 0, y: 0 }]));

  const repulsion = 7200;
  const spring = 0.01;
  const springLength = 210;
  const damping = 0.84;

  for (let step = 0; step < iterations; step += 1) {
    nodes.forEach((nodeA) => {
      const posA = positions.get(nodeA.id);
      const velA = velocity.get(nodeA.id);
      if (!posA || !velA) {
        return;
      }

      nodes.forEach((nodeB) => {
        if (nodeA.id === nodeB.id) {
          return;
        }
        const posB = positions.get(nodeB.id);
        if (!posB) {
          return;
        }

        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const distSq = Math.max(1, dx * dx + dy * dy);
        const force = repulsion / distSq;
        velA.x += (dx / Math.sqrt(distSq)) * force;
        velA.y += (dy / Math.sqrt(distSq)) * force;
      });
    });

    edges.forEach((edge) => {
      const posFrom = positions.get(edge.from);
      const posTo = positions.get(edge.to);
      const velFrom = velocity.get(edge.from);
      const velTo = velocity.get(edge.to);
      if (!posFrom || !posTo || !velFrom || !velTo) {
        return;
      }

      const dx = posTo.x - posFrom.x;
      const dy = posTo.y - posFrom.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = spring * (dist - springLength);

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      velFrom.x += fx;
      velFrom.y += fy;
      velTo.x -= fx;
      velTo.y -= fy;
    });

    nodes.forEach((node) => {
      const pos = positions.get(node.id);
      const vel = velocity.get(node.id);
      if (!pos || !vel) {
        return;
      }

      vel.x *= damping;
      vel.y *= damping;
      pos.x += vel.x * 0.018;
      pos.y += vel.y * 0.018;
    });
  }

  return nodes.map((node) => {
    const pos = positions.get(node.id);
    if (!pos) {
      return node;
    }

    return {
      ...node,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      updatedAt: nowIso()
    };
  });
}

function walkForward(sourceId, edges) {
  const out = new Set();
  const queue = [sourceId];

  while (queue.length) {
    const current = queue.shift();
    edges.forEach((edge) => {
      if (edge.from !== current || out.has(edge.to)) {
        return;
      }
      out.add(edge.to);
      queue.push(edge.to);
    });
  }

  out.delete(sourceId);
  return out;
}

function walkBackward(sourceId, edges) {
  const out = new Set();
  const queue = [sourceId];

  while (queue.length) {
    const current = queue.shift();
    edges.forEach((edge) => {
      if (edge.to !== current || out.has(edge.from)) {
        return;
      }
      out.add(edge.from);
      queue.push(edge.from);
    });
  }

  out.delete(sourceId);
  return out;
}

export function getRelatedNodeSet(nodeId, edges) {
  if (!nodeId) {
    return new Set();
  }
  const forward = walkForward(nodeId, edges);
  const backward = walkBackward(nodeId, edges);
  return new Set([nodeId, ...forward, ...backward]);
}

/**
 * @param {string} nodeId - Root node id.
 * @param {Array<object>} edges - Graph edges.
 * @returns {Set<string>} All descendant node ids reachable from root.
 */
export function getDescendantNodeIds(nodeId, edges) {
  return walkForward(nodeId, edges);
}

/**
 * @param {Array<object>} nodes - Graph nodes.
 * @param {Array<object>} edges - Graph edges.
 * @returns {{nodeIds:string[], edgeIds:string[]}} Longest estimated path in DAG form.
 */
export function computeCriticalPath(nodes, edges) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, []]));

  edges.forEach((edge) => {
    if (!nodeById.has(edge.from) || !nodeById.has(edge.to)) {
      return;
    }
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
    outgoing.set(edge.from, [...(outgoing.get(edge.from) || []), edge.to]);
  });

  const queue = [];
  incoming.forEach((count, nodeId) => {
    if (count === 0) {
      queue.push(nodeId);
    }
  });

  const topo = [];
  while (queue.length) {
    const current = queue.shift();
    topo.push(current);
    (outgoing.get(current) || []).forEach((next) => {
      const nextCount = (incoming.get(next) || 0) - 1;
      incoming.set(next, nextCount);
      if (nextCount === 0) {
        queue.push(next);
      }
    });
  }

  if (topo.length !== nodes.length) {
    return { nodeIds: [], edgeIds: [] };
  }

  const distances = new Map(nodes.map((node) => [node.id, Number.NEGATIVE_INFINITY]));
  const previous = new Map();

  topo.forEach((nodeId) => {
    if ((incoming.get(nodeId) || 0) === 0) {
      distances.set(nodeId, Math.max(1, Number(nodeById.get(nodeId)?.estimateMinutes || 1)));
    }

    const base = distances.get(nodeId);
    if (!Number.isFinite(base)) {
      return;
    }

    (outgoing.get(nodeId) || []).forEach((next) => {
      const weight = Math.max(1, Number(nodeById.get(next)?.estimateMinutes || 1));
      const candidate = base + weight;
      if (candidate > (distances.get(next) || Number.NEGATIVE_INFINITY)) {
        distances.set(next, candidate);
        previous.set(next, nodeId);
      }
    });
  });

  let endNodeId = null;
  let maxDistance = Number.NEGATIVE_INFINITY;

  distances.forEach((distance, nodeId) => {
    if (distance > maxDistance) {
      maxDistance = distance;
      endNodeId = nodeId;
    }
  });

  if (!endNodeId) {
    return { nodeIds: [], edgeIds: [] };
  }

  const pathNodes = [];
  let cursor = endNodeId;
  while (cursor) {
    pathNodes.push(cursor);
    cursor = previous.get(cursor);
  }
  pathNodes.reverse();

  const pathEdges = [];
  for (let index = 0; index < pathNodes.length - 1; index += 1) {
    const from = pathNodes[index];
    const to = pathNodes[index + 1];
    const edge = edges.find((entry) => entry.from === from && entry.to === to);
    if (edge) {
      pathEdges.push(edge.id);
    }
  }

  return {
    nodeIds: pathNodes,
    edgeIds: pathEdges
  };
}

/**
 * @param {Array<object>} nodes - Graph nodes.
 * @param {Array<object>} edges - Graph edges.
 * @param {string} rootNodeId - Root node id for the subtree copy.
 * @returns {{nodes:Array<object>, edges:Array<object>, rootId:string|null}} Updated graph and copied root id.
 */
export function duplicateSubtree(nodes, edges, rootNodeId) {
  const root = nodes.find((node) => node.id === rootNodeId);
  if (!root) {
    return { nodes, edges, rootId: null };
  }

  const descendants = getDescendantNodeIds(rootNodeId, edges);
  const scope = new Set([rootNodeId, ...descendants]);
  const map = new Map();

  const clones = nodes
    .filter((node) => scope.has(node.id))
    .map((node) => {
      const nextId = makeId('node');
      map.set(node.id, nextId);
      return {
        ...node,
        id: nextId,
        label: `${node.label} copy`,
        x: node.x + 72,
        y: node.y + 72,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        collapsed: false
      };
    });

  const cloneEdges = edges
    .filter((edge) => scope.has(edge.from) && scope.has(edge.to))
    .map((edge) => ({
      ...edge,
      id: makeId('edge'),
      from: map.get(edge.from),
      to: map.get(edge.to),
      createdAt: nowIso(),
      updatedAt: nowIso()
    }));

  return {
    nodes: [...nodes, ...clones],
    edges: [...edges, ...cloneEdges],
    rootId: map.get(rootNodeId) || null
  };
}

function escapeXml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

  /**
   * @param {Array<object>} graphNodes - Graph nodes with x/y and size fields.
   * @param {Array<object>} graphEdges - Graph edges with `from` and `to` node ids.
   * @param {object} [options] - Export options.
   * @param {string} [options.title] - SVG title text.
   * @returns {string} SVG XML markup.
   */
export function graphToSvg(graphNodes, graphEdges, { title = 'Graph Export' } = {}) {
  const nodes = graphNodes.map((node) => {
    const size = nodeSizeToDimensions(node.size);
    return {
      ...node,
      width: size.width,
      height: size.height
    };
  });

  const minX = Math.min(0, ...nodes.map((node) => node.x));
  const minY = Math.min(0, ...nodes.map((node) => node.y));
  const maxX = Math.max(640, ...nodes.map((node) => node.x + node.width));
  const maxY = Math.max(420, ...nodes.map((node) => node.y + node.height));
  const width = maxX - minX + 48;
  const height = maxY - minY + 48;
  const offsetX = 24 - minX;
  const offsetY = 24 - minY;

  const defs = `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#6a4a34" />
      </marker>
    </defs>
  `;

  const edgeMarkup = graphEdges
    .map((edge) => {
      const from = nodes.find((node) => node.id === edge.from);
      const to = nodes.find((node) => node.id === edge.to);
      if (!from || !to) {
        return '';
      }

      const x1 = from.x + from.width + offsetX;
      const y1 = from.y + from.height / 2 + offsetY;
      const x2 = to.x + offsetX;
      const y2 = to.y + to.height / 2 + offsetY;

      if (edge.type === 'orthogonal') {
        const midX = Math.round((x1 + x2) / 2);
        return `<path d="M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}" stroke="#6a4a34" stroke-width="2" fill="none" marker-end="url(#arrow)" />`;
      }

      if (edge.type === 'straight') {
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6a4a34" stroke-width="2" marker-end="url(#arrow)" />`;
      }

      const cx1 = x1 + 68;
      const cx2 = x2 - 68;
      return `<path d="M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}" stroke="#6a4a34" stroke-width="2" fill="none" marker-end="url(#arrow)" />`;
    })
    .join('\n');

  const nodeMarkup = nodes
    .map((node) => {
      const x = node.x + offsetX;
      const y = node.y + offsetY;
      const w = node.width;
      const h = node.height;
      const fill = escapeXml(node.color || '#b08968');
      const stroke = escapeXml(node.borderColor || '#6a4a34');
      const textColor = escapeXml(node.textColor || '#2e241f');

      if (node.shape === 'circle') {
        const r = Math.min(w, h) / 2;
        const cx = x + w / 2;
        const cy = y + h / 2;
        return `
          <g>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" />
            <text x="${cx}" y="${cy}" fill="${textColor}" font-size="14" text-anchor="middle" dominant-baseline="middle">${escapeXml(node.icon || '')} ${escapeXml(node.label)}</text>
          </g>
        `;
      }

      if (node.shape === 'diamond') {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const points = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
        return `
          <g>
            <polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="2" />
            <text x="${cx}" y="${cy}" fill="${textColor}" font-size="13" text-anchor="middle" dominant-baseline="middle">${escapeXml(node.icon || '')} ${escapeXml(node.label)}</text>
          </g>
        `;
      }

      const radius = node.shape === 'pill' ? Math.round(h / 2) : 14;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" />
          <text x="${x + 12}" y="${y + h / 2}" fill="${textColor}" font-size="14" dominant-baseline="middle">${escapeXml(node.icon || '')} ${escapeXml(node.label)}</text>
        </g>
      `;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${defs}
  <rect width="100%" height="100%" fill="#f4ede6" />
  <text x="24" y="22" fill="#5d4738" font-size="14" font-family="Georgia, serif">${escapeXml(title)}</text>
  ${edgeMarkup}
  ${nodeMarkup}
</svg>`;
}
