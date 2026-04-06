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
      className={`w-full h-full border-2 border-[var(--node-border)] text-[var(--node-fg)] bg-[var(--node-bg)] opacity-[var(--node-opacity)] rounded-[0.9rem] shadow-[0_10px_24px_color-mix(in_oklch,var(--node-border),transparent_75%)] p-1 grid gap-1 ${shapeClass} ${sizeClass} ${stateClass} ${focusClass} ${criticalClass} ${searchClass} ${collapsedClass} ${selected ? "shadow-[0_0_0_2px_color-mix(in_oklch,var(--accent),transparent_15%),0_16px_26px_color-mix(in_oklch,var(--node-border),transparent_74%)]" : ""}`}
      style={nodeStyle}
      title={data.description || data.label}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 border border-[color-mix(in_oklch,var(--node-border),transparent_12%)] rounded bg-[color-mix(in_oklch,var(--node-bg),black_30%)]" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`border border-[color-mix(in_oklch,var(--node-border),transparent_25%)] bg-[color-mix(in_oklch,var(--node-bg),white_20%)] w-[1.15rem] h-[1.15rem] rounded grid place-items-center text-[color-mix(in_oklch,var(--node-fg),black_28%)] cursor-pointer ${data.completed ? "bg-[color-mix(in_oklch,var(--success)_52%,var(--node-bg))]" : ""}`}
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
          className="border-none bg-transparent inline-flex items-center gap-1 cursor-text min-w-0"
          onDoubleClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            data.onRename?.(data.id);
          }}
          title="Double-click to rename"
        >
          <span className="text-[0.82rem]">{data.icon || "◉"}</span>
          <span className="whitespace-nowrap overflow-hidden text-ellipsis font-[650]">{data.label}</span>
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-[var(--line)] text-xs ${
          (data.priority || "medium") === "low" ? "bg-[color-mix(in_oklch,var(--success)_15%,var(--surface))]" :
          (data.priority || "medium") === "medium" ? "bg-[color-mix(in_oklch,var(--warning)_18%,var(--surface))]" :
          (data.priority || "medium") === "high" ? "bg-[color-mix(in_oklch,var(--accent)_16%,var(--surface))]" :
          (data.priority || "medium") === "critical" ? "bg-[color-mix(in_oklch,var(--error)_20%,var(--surface))]" :
          ""
        }`}>
          {data.priority || "medium"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-[var(--line)] text-xs bg-[color-mix(in_oklch,var(--surface),white_8%)] dark:bg-[color-mix(in_oklch,var(--surface),black_18%)]">
          {data.status || "todo"}
        </span>
        {typeof data.connectionCount === "number" && (
          <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 border border-[var(--line)] text-xs">
            <Link2 size={10} /> {data.connectionCount}
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <div
          className="w-full h-2 rounded-full bg-[color-mix(in_oklch,var(--node-bg),black_17%)] overflow-hidden"
          role="status"
          aria-label={`Branch progress ${progress}%`}
        >
          <span className="block h-full bg-[color-mix(in_oklch,var(--success),white_15%)]" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="border border-[color-mix(in_oklch,var(--node-border),transparent_20%)] bg-[color-mix(in_oklch,var(--node-bg),white_20%)] w-[1.25rem] h-[1.25rem] rounded grid place-items-center cursor-pointer"
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
        className="w-2.5 h-2.5 border border-[color-mix(in_oklch,var(--node-border),transparent_12%)] rounded bg-[color-mix(in_oklch,var(--node-bg),black_30%)]"
      />
    </div>
  );
}
