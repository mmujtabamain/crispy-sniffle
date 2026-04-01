import { useCallback } from 'react';
import { toJpeg, toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import type { GraphEdge, GraphNode } from '../../../lib/workspace';
import { graphToSvg } from '../../../lib/graph-layout';
import type { ExportImageFormat, NotifyKind } from './types';
import { clamp, createDownload, downloadFromDataUrl } from './utils';

interface ExportImageConfig {
  exportScale: number;
  transparentExport: boolean;
  exportBackground: string;
}

/**
 * Encapsulates graph export/import functionality.
 * Handles JSON, SVG, PNG, JPG, PDF export and file import.
 * Note: Callers must provide canvasRef since it's component-scope DOM state.
 */
export function useGraphExport(
  nodes: GraphNode[],
  edges: GraphEdge[],
  exportName: string,
  notify: (type: NotifyKind, message: string) => void
) {
  const handleExportGraphJson = useCallback(() => {
    const payload = JSON.stringify({ nodes, edges }, null, 2);
    createDownload(
      `${exportName || 'graph-export'}.graph.json`,
      payload,
      'application/json;charset=utf-8'
    );
    notify('success', 'Graph exported as JSON.');
  }, [nodes, edges, exportName, notify]);

  const handleExportSvg = useCallback(() => {
    const svg = graphToSvg(nodes, edges, { title: exportName || 'Graph Export' });
    createDownload(
      `${exportName || 'graph-export'}.svg`,
      svg,
      'image/svg+xml;charset=utf-8'
    );
    notify('success', 'Graph exported as SVG.');
  }, [nodes, edges, exportName, notify]);

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

  return {
    handleExportGraphJson,
    handleExportSvg,
    handlePrintGraph
  };
}
