import { Focus, Network } from "lucide-react";
import {
  PRIORITIES,
  SHAPES,
  SIZES,
  STATUSES,
} from "../constants";
import { getDescendantNodeIds } from "../../../../lib/graph-layout";
import { parseTags } from "../utils";
import type { GraphNode } from "../../../../lib/workspace";
import type { GraphInspectorProps } from "./types";

export default function GraphInspector({
  nodeCount,
  edgeCount,
  selectedNodeCount,
  selectedEdgeCount,
  activeNode,
  edges,
  todos,
  linkedTodo,
  onPatchActiveNode,
  onJumpToTodo,
  onCenterOnNode,
  onNotify,
}: GraphInspectorProps) {
  return (
    <section className="grid gap-2 rounded-2xl p-3 bg-[var(--surface)] border border-[color-mix(in_oklch,var(--line),transparent_20%)] shadow-[var(--shadow)]">
      <h3>Graph Inspector</h3>
      <p className="text-sm text-[var(--ink-1)]">
        {nodeCount} nodes, {edgeCount} connections, {selectedNodeCount} selected
        node(s), {selectedEdgeCount} selected edge(s)
      </p>

      {activeNode ? (
        <div className="grid gap-2">
          <div className="inspector-row two">
            <label>
              Label
              <input
                value={activeNode.label}
                onChange={(event) =>
                  onPatchActiveNode({
                    label: event.target.value || activeNode.label,
                  })
                }
              />
            </label>
            <label>
              Icon/emoji
              <input
                value={activeNode.icon || ""}
                onChange={(event) =>
                  onPatchActiveNode({
                    icon: event.target.value.slice(0, 2) || "◉",
                  })
                }
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              rows={3}
              value={activeNode.description || ""}
              onChange={(event) =>
                onPatchActiveNode({ description: event.target.value })
              }
            />
          </label>

          <div className="inspector-row two">
            <label>
              Shape
              <select
                value={activeNode.shape}
                onChange={(event) =>
                  onPatchActiveNode({
                    shape: event.target.value as GraphNode["shape"],
                  })
                }
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
                onChange={(event) =>
                  onPatchActiveNode({
                    size: event.target.value as GraphNode["size"],
                  })
                }
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
                  onPatchActiveNode({
                    priority: event.target.value as GraphNode["priority"],
                  })
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
                onChange={(event) =>
                  onPatchActiveNode({
                    status: event.target.value as GraphNode["status"],
                  })
                }
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
                onChange={(event) =>
                  onPatchActiveNode({ color: event.target.value })
                }
              />
            </label>
            <label>
              Text
              <input
                type="color"
                value={activeNode.textColor}
                onChange={(event) =>
                  onPatchActiveNode({ textColor: event.target.value })
                }
              />
            </label>
            <label>
              Border
              <input
                type="color"
                value={activeNode.borderColor}
                onChange={(event) =>
                  onPatchActiveNode({ borderColor: event.target.value })
                }
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
              onChange={(event) =>
                onPatchActiveNode({ opacity: Number(event.target.value) })
              }
            />
          </label>

          <div className="inspector-row two">
            <label>
              Alias
              <input
                value={activeNode.alias || ""}
                onChange={(event) =>
                  onPatchActiveNode({ alias: event.target.value })
                }
              />
            </label>
            <label>
              Owner
              <input
                value={activeNode.owner || ""}
                onChange={(event) =>
                  onPatchActiveNode({ owner: event.target.value })
                }
              />
            </label>
          </div>

          <label>
            Tags
            <input
              value={(activeNode.tags || []).join(", ")}
              onChange={(event) =>
                onPatchActiveNode({ tags: parseTags(event.target.value) })
              }
              placeholder="planning, release"
            />
          </label>

          <label>
            Link to todo
            <select
              value={activeNode.todoId || ""}
              onChange={(event) =>
                onPatchActiveNode({ todoId: event.target.value || null })
              }
            >
              <option value="">None</option>
              {todos.map((todo) => (
                <option key={todo.id} value={todo.id}>
                  {todo.text}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-[0.45rem]">
              <input
                type="checkbox"
                checked={Boolean(activeNode.completed)}
                onChange={(event) =>
                  onPatchActiveNode({ completed: event.target.checked })
                }
              />
              <span>Completed</span>
            </label>

            <label className="flex items-center gap-[0.45rem]">
              <input
                type="checkbox"
                checked={Boolean(activeNode.collapsed)}
                onChange={(event) =>
                  onPatchActiveNode({ collapsed: event.target.checked })
                }
              />
              <span>Collapsed</span>
            </label>

            <label className="flex items-center gap-[0.45rem]">
              <input
                type="checkbox"
                checked={Boolean(activeNode.shadow)}
                onChange={(event) =>
                  onPatchActiveNode({ shadow: event.target.checked })
                }
              />
              <span>Shadow</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
              onClick={() => {
                const descendants = getDescendantNodeIds(activeNode.id, edges);
                onNotify(
                  "success",
                  `${descendants.size} downstream node(s) in this branch.`,
                );
              }}
            >
              <Network size={14} /> Branch stats
            </button>
            {linkedTodo ? (
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
                onClick={() => onJumpToTodo?.(linkedTodo.id)}
              >
                <Focus size={14} /> Open linked todo
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
              onClick={() => onCenterOnNode(activeNode.id)}
            >
              <Focus size={14} /> Center on node
            </button>
          </div>

          <p className="text-sm text-[var(--ink-1)]">
            Created: {new Date(activeNode.createdAt).toLocaleString()} · Updated:{" "}
            {new Date(activeNode.updatedAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-1)]">
          Select a node to edit shape, metadata, colors, links, and branch
          controls.
        </p>
      )}
    </section>
  );
}
