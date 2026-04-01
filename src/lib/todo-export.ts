import { jsPDF } from 'jspdf';
import type { Todo } from './workspace';

interface TodoExportOptions {
  fileName?: string;
  title?: string;
  headerText?: string;
  footerText?: string;
  includeCompletion?: boolean;
  includePriority?: boolean;
  includeDue?: boolean;
  includeTags?: boolean;
  includeCheckbox?: boolean;
}

interface CanvasExportOptions extends TodoExportOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  fontSize?: number;
}

interface ImageExportOptions extends CanvasExportOptions {
  fileNameBase?: string;
  mode?: 'single' | 'gallery';
  todosPerImage?: number;
  formats?: string[];
}

/**
 * Downloads a blob to the user's device.
 * @param {Blob} blob - Binary payload to download.
 * @param {string} fileName - Filename for the browser download prompt.
 * @returns {void}
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Escapes HTML special characters in a string.
 * @param {string | number} text - Text to escape.
 * @returns {string} Escaped text safe for HTML.
 */
function escapeHtml(text: string | number): string {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Formats a todo item as a single line for export/print output.
 * @param {Todo} todo - Todo data to format.
 * @param {TodoExportOptions} options - Line formatting options.
 * @returns {string} Rendered line for export/print output.
 */
function formatTodoLine(todo: Todo, options: TodoExportOptions): string {
  const includeCompletion = options.includeCompletion ?? true;
  const includePriority = options.includePriority ?? true;
  const includeDue = options.includeDue ?? true;
  const includeTags = options.includeTags ?? true;
  const includeCheckbox = options.includeCheckbox ?? true;

  const parts: string[] = [];
  if (includeCheckbox) {
    parts.push(todo.completed ? '[x]' : '[ ]');
  }
  parts.push(todo.text);

  if (includeCompletion) {
    parts.push(todo.completed ? 'done' : 'open');
  }
  if (includePriority) {
    parts.push(`priority:${todo.priority}`);
  }
  if (includeDue && todo.dueDate) {
    parts.push(`due:${todo.dueDate}`);
  }
  if (includeTags && todo.tags?.length) {
    parts.push(`tags:${todo.tags.join('|')}`);
  }

  return parts.join('  ');
}

/**
 * Wraps text to fit within a maximum width using canvas text measurement.
 * @param {CanvasRenderingContext2D} ctx - Canvas context for measuring text width.
 * @param {string} text - Text to wrap.
 * @param {number} maxWidth - Maximum width per line in pixels.
 * @returns {string[]} Wrapped lines.
 */
function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word: string) => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
      return;
    }

    if (current) {
      lines.push(current);
    }
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Exports todos to a PDF file.
 * @param {Todo[]} todos - Todos to export to PDF.
 * @param {TodoExportOptions} [options] - PDF export options.
 * @returns {void}
 */
export function exportTodosToPdf(todos: Todo[], options: TodoExportOptions = {}): void {
  const todoItems = Array.isArray(todos) ? todos : [];
  const safeOptions: TodoExportOptions & {
    fileName: string;
    title: string;
    headerText: string;
    footerText: string;
    includeCompletion: boolean;
    includePriority: boolean;
    includeDue: boolean;
    includeTags: boolean;
    includeCheckbox: boolean;
  } = {
    fileName: 'todos.pdf',
    title: 'Todo Export',
    headerText: '',
    footerText: '',
    includeCompletion: true,
    includePriority: true,
    includeDue: true,
    includeTags: true,
    includeCheckbox: true,
    ...options
  };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const lineHeight = 18;
  const maxWidth = pageWidth - margin * 2;

  let cursorY = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(safeOptions.title, margin, cursorY);
  cursorY += 20;

  if (safeOptions.headerText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(safeOptions.headerText, margin, cursorY);
    cursorY += 18;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  todoItems.forEach((todo: Todo, index: number) => {
    const line = `${index + 1}. ${formatTodoLine(todo, safeOptions)}`;
    const wrapped = doc.splitTextToSize(line, maxWidth);

    if (cursorY + wrapped.length * lineHeight > pageHeight - margin - 24) {
      doc.addPage();
      cursorY = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(safeOptions.title, margin, cursorY);
      cursorY += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
    }

    doc.text(wrapped, margin, cursorY);
    cursorY += wrapped.length * lineHeight;
  });

  if (safeOptions.footerText) {
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(`${safeOptions.footerText} · page ${page}/${pages}`, margin, pageHeight - 18);
    }
  }

  doc.save(safeOptions.fileName);
}

/**
 * Prints todos in a browser print window.
 * @param {Todo[]} todos - Todos to print.
 * @param {TodoExportOptions} [options] - Print options.
 * @returns {void}
 */
export function printTodos(todos: Todo[], options: TodoExportOptions = {}): void {
  const todoItems = Array.isArray(todos) ? todos : [];
  const safeOptions: TodoExportOptions & {
    title: string;
    includeCompletion: boolean;
    includePriority: boolean;
    includeDue: boolean;
    includeTags: boolean;
    includeCheckbox: boolean;
  } = {
    title: 'Todo Print View',
    includeCompletion: true,
    includePriority: true,
    includeDue: true,
    includeTags: true,
    includeCheckbox: true,
    ...options
  };

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeOptions.title}</title>
    <style>
      body { font-family: Georgia, serif; padding: 24px; color: #2b241f; }
      h1 { margin-bottom: 8px; }
      ol { padding-left: 20px; }
      li { margin-bottom: 8px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <h1>${safeOptions.title}</h1>
    <ol>
      ${todoItems
        .map((todo: Todo) => `<li>${escapeHtml(formatTodoLine(todo, safeOptions))}</li>`)
        .join('')}
    </ol>
  </body>
</html>`;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!printWindow) {
    throw new Error('Browser blocked the print window.');
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

/**
 * Renders todos onto an HTML canvas element.
 * @param {Todo[]} todos - Todos to render on a single image page.
 * @param {CanvasExportOptions} options - Rendering options.
 * @returns {HTMLCanvasElement} Canvas containing the rendered todo page.
 */
function renderTodosPageToCanvas(todos: Todo[], options: CanvasExportOptions): HTMLCanvasElement {
  const width = Number(options.width) || 1400;
  const height = Number(options.height) || 1800;
  const bgColor = options.backgroundColor || '#f6efe9';
  const fontSize = Number(options.fontSize) || 28;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create image canvas.');
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#2f2722';
  ctx.font = `${fontSize + 8}px Georgia, serif`;
  ctx.fillText(options.title || 'Todo Export', 72, 90);

  ctx.font = `${fontSize}px Manrope, sans-serif`;
  let y = 150;
  const lineHeight = fontSize + 16;
  const maxWidth = width - 144;

  todos.forEach((todo: Todo, index: number) => {
    const base = `${index + 1}. ${todo.completed ? '[x]' : '[ ]'} ${todo.text}`;
    const detail = [todo.priority, todo.status, todo.dueDate ? `due ${todo.dueDate}` : null]
      .filter(Boolean)
      .join(' · ');

    const lines = wrapCanvasText(ctx, `${base}${detail ? ` (${detail})` : ''}`, maxWidth);
    lines.forEach((line: string) => {
      ctx.fillText(line, 72, y);
      y += lineHeight;
    });

    if (todo.tags?.length) {
      const tagLine = `tags: ${todo.tags.join(', ')}`;
      const tagLines = wrapCanvasText(ctx, tagLine, maxWidth - 24);
      tagLines.forEach((line: string) => {
        ctx.fillStyle = '#5b4a41';
        ctx.fillText(line, 96, y);
        y += lineHeight;
      });
      ctx.fillStyle = '#2f2722';
    }

    y += 8;
  });

  return canvas;
}

/**
 * Exports todos as image files (PNG or JPEG).
 * @param {Todo[]} todos - Todos to export as images.
 * @param {ImageExportOptions} [options] - Image export options.
 * @returns {void}
 */
export function exportTodosToImages(todos: Todo[], options: ImageExportOptions = {}): void {
  const todoItems = Array.isArray(todos) ? todos : [];
  if (todoItems.length === 0) {
    return;
  }

  const safeOptions: ImageExportOptions & {
    fileNameBase: string;
    mode: 'single' | 'gallery';
    width: number;
    height: number;
    backgroundColor: string;
    fontSize: number;
    todosPerImage: number;
    formats: string[];
    title: string;
  } = {
    fileNameBase: 'todos',
    mode: 'single',
    width: 1400,
    height: 1800,
    backgroundColor: '#f6efe9',
    fontSize: 28,
    todosPerImage: 12,
    formats: ['png'],
    title: 'Todo Export',
    ...options
  };

  const pageSize = Math.max(1, Number(safeOptions.todosPerImage) || 12);
  const chunks = safeOptions.mode === 'gallery'
    ? Array.from({ length: Math.ceil(todoItems.length / pageSize) }, (_: unknown, idx: number) =>
        todoItems.slice(idx * pageSize, idx * pageSize + pageSize)
      )
    : [todoItems];

  const safeFormats = Array.isArray(safeOptions.formats) && safeOptions.formats.length > 0
    ? safeOptions.formats
    : ['png'];

  chunks.forEach((chunk: Todo[], pageIndex: number) => {
    const canvas = renderTodosPageToCanvas(chunk, safeOptions);

    safeFormats.forEach((format: string) => {
      const normalized = format === 'jpg' ? 'jpeg' : format;
      const mime = normalized === 'jpeg' ? 'image/jpeg' : 'image/png';
      const extension = normalized === 'jpeg' ? 'jpg' : 'png';
      const dataUrl = canvas.toDataURL(mime, 0.92);
      const binary = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([bytes], { type: mime });
      const suffix = chunks.length > 1 ? `-${String(pageIndex + 1).padStart(2, '0')}` : '';
      downloadBlob(blob, `${safeOptions.fileNameBase}${suffix}.${extension}`);
    });
  });
}
