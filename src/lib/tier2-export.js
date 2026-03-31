import { jsPDF } from 'jspdf';

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatTodoLine(todo, options) {
  const includeCompletion = options.includeCompletion ?? true;
  const includePriority = options.includePriority ?? true;
  const includeDue = options.includeDue ?? true;
  const includeTags = options.includeTags ?? true;
  const includeCheckbox = options.includeCheckbox ?? true;

  const parts = [];
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

function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  words.forEach((word) => {
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

export function exportTodosToPdf(todos, options = {}) {
  const safeOptions = {
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

  todos.forEach((todo, index) => {
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

export function printTodos(todos, options = {}) {
  const safeOptions = {
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
      ${todos
        .map((todo) => `<li>${formatTodoLine(todo, safeOptions).replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</li>`)
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

function renderTodosPageToCanvas(todos, options) {
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

  todos.forEach((todo, index) => {
    const base = `${index + 1}. ${todo.completed ? '[x]' : '[ ]'} ${todo.text}`;
    const detail = [todo.priority, todo.status, todo.dueDate ? `due ${todo.dueDate}` : null]
      .filter(Boolean)
      .join(' · ');

    const lines = wrapCanvasText(ctx, `${base}${detail ? ` (${detail})` : ''}`, maxWidth);
    lines.forEach((line) => {
      ctx.fillText(line, 72, y);
      y += lineHeight;
    });

    if (todo.tags?.length) {
      const tagLine = `tags: ${todo.tags.join(', ')}`;
      const tagLines = wrapCanvasText(ctx, tagLine, maxWidth - 24);
      tagLines.forEach((line) => {
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

export function exportTodosToImages(todos, options = {}) {
  const safeOptions = {
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
    ? Array.from({ length: Math.ceil(todos.length / pageSize) }, (_, idx) =>
        todos.slice(idx * pageSize, idx * pageSize + pageSize)
      )
    : [todos];

  const safeFormats = Array.isArray(safeOptions.formats) && safeOptions.formats.length > 0
    ? safeOptions.formats
    : ['png'];

  chunks.forEach((chunk, pageIndex) => {
    const canvas = renderTodosPageToCanvas(chunk, safeOptions);

    safeFormats.forEach((format) => {
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
