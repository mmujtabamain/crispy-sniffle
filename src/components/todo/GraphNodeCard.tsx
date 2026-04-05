import type { CSSProperties, ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { Check, Link2, Plus } from "lucide-react";

interface GraphNodeData {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  color?: string;
  textColor?: string;
  borderColor?: string;
  opacity?: number;
  branchProgress?: number;
  completed?: boolean;
  dimmed?: boolean;
  related?: boolean;
  critical?: boolean;
  searchMatch?: boolean;
  collapsed?: boolean;
  priority?: string;
  status?: string;
  connectionCount?: number;
  shape?: string;
  size?: string;
  onToggleCompleted?: (id: string) => void;
  onRename?: (id: string) => void;
  onAddChild?: (id: string) => void;
}

interface GraphNodeCardProps {
  data: GraphNodeData;
  selected?: boolean;
}

export default function GraphNodeCard({
  data,
  selected,
}: GraphNodeCardProps): ReactNode {
  const nodeStyle: CSSProperties = {
    "--node-bg": data.color || "#b08968",
    "--node-fg": data.textColor || "#2e241f",
    "--node-border": data.borderColor || "#8a6042",
    "--node-opacity": data.opacity || 1,
  } as CSSProperties;

  const progress =
    typeof data.branchProgress === "number" &&
    Number.isFinite(data.branchProgress)
      ? Math.max(0, Math.min(100, data.branchProgress))
      : null;
  const shapeClass = `shape-${data.shape || "square"}`;
  const sizeClass = `size-${data.size || "md"}`;
  const stateClass = data.completed ? "node-complete" : "";
  const focusClass = data.dimmed ? "dimmed" : data.related ? "related" : "";
  const criticalClass = data.critical ? "critical" : "";
  const searchClass = data.searchMatch ? "search-match" : "";
  const collapsedClass = data.collapsed ? "collapsed" : "";

  return (
    <div
      className={`graph-node-card ${shapeClass} ${sizeClass} ${stateClass} ${focusClass} ${criticalClass} ${searchClass} ${collapsedClass} ${selected ? "selected" : ""}`}
      style={nodeStyle}
      title={data.description || data.label}
    >
      <Handle type="target" position={Position.Left} className="graph-handle" />

      <div className="graph-node-top">
        <button
          type="button"
          className={`graph-complete-toggle ${data.completed ? "checked" : ""}`}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            data.onToggleCompleted?.(data.id);
          }}
          aria-label="Toggle node completion"
        >
          {data.completed ? <Check size={11} /> : null}
        </button>

        <button
          type="button"
          className="graph-node-label"
          onDoubleClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            data.onRename?.(data.id);
          }}
          title="Double-click to rename"
        >
          <span className="node-icon">{data.icon || "◉"}</span>
          <span className="node-title-text">{data.label}</span>
        </button>
      </div>

      <div className="graph-node-meta">
        <span className={`pill priority-${data.priority || "medium"}`}>
          {data.priority || "medium"}
        </span>
        <span className={`pill status-${data.status || "todo"}`}>
          {data.status || "todo"}
        </span>
        {typeof data.connectionCount === "number" && (
          <span className="pill graph-link-pill">
            <Link2 size={10} /> {data.connectionCount}
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <div
          className="graph-progress"
          role="status"
          aria-label={`Branch progress ${progress}%`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="graph-node-actions">
        <button
          type="button"
          className="graph-mini-action"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            data.onAddChild?.(data.id);
          }}
          aria-label="Add child node"
        >
          <Plus size={12} />
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="graph-handle"
      />
    </div>
  );
}
