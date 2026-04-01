import { getDescendantNodeIds } from '../../../lib/graph-layout';
import type { GraphEdge, GraphNode } from '../../../lib/workspace';

export function nowIso(): string {
  return new Date().toISOString();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function createDownload(fileName: string, content: string, mimeType: string): void {
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

export function downloadFromDataUrl(fileName: string, dataUrl: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function isInputLikeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function collectHiddenNodeIds(nodes: GraphNode[], edges: GraphEdge[]): Set<string> {
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

export function buildBranchProgress(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number | null> {
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