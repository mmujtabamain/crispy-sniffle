import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  SelectionMode,
} from "@xyflow/react";
import type { GraphCanvasProps } from "./types";

export default function GraphCanvas({
  canvasRef,
  nodeTypes,
  nodes,
  edges,
  onNodesChange,
  onNodeDragStop,
  onEdgesChange,
  onConnect,
  onSelectionChange,
  onPaneDoubleClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
  snapToGrid,
  gridSize,
  showMiniMap,
  searchMatches,
}: GraphCanvasProps) {
  return (
    <div className="grid gap-2 rounded-2xl p-3 bg-[var(--surface)] border border-[color-mix(in_oklch,var(--line),transparent_20%)] shadow-[var(--shadow)] min-h-[clamp(420px,68vh,820px)] p-0 overflow-hidden" ref={canvasRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onPaneClick={(event) => {
          if (event?.detail === 2) {
            onPaneDoubleClick(event);
          }
        }}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        deleteKeyCode={null}
        panOnDrag
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          gap={gridSize}
          size={1}
          variant={BackgroundVariant.Lines}
          color="var(--line)"
        />
        <Controls />
        {showMiniMap ? (
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => {
              const matched = searchMatches.has(node.id);
              if (matched) {
                return "#9f3027";
              }
              return typeof node.data?.color === "string"
                ? node.data.color
                : "#b08968";
            }}
          />
        ) : null}
      </ReactFlow>
    </div>
  );
}
