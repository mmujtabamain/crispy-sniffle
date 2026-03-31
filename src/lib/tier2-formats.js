import { createTodo, createWorkspace, makeId } from './workspace';

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  const needsQuotes = text.includes(',') || text.includes('"') || text.includes('\n');
  const escaped = text.replaceAll('"', '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((entry) => entry.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
}

function normalizeTags(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[;,|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeLinks(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  return String(value)
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function todosToJson(todos) {
  return JSON.stringify(todos, null, 2);
}

export function todosToCsv(todos) {
  const headers = [
    'id',
    'text',
    'completed',
    'priority',
    'status',
    'dueDate',
    'tags',
    'description',
    'category',
    'estimateMinutes',
    'actualMinutes',
    'notes',
    'links',
    'createdAt',
    'updatedAt'
  ];

  const rows = todos.map((todo) =>
    [
      todo.id,
      todo.text,
      todo.completed,
      todo.priority,
      todo.status,
      todo.dueDate || '',
      (todo.tags || []).join('|'),
      todo.description || '',
      todo.category || '',
      todo.estimateMinutes ?? '',
      todo.actualMinutes ?? '',
      todo.notes || '',
      (todo.links || []).join('|'),
      todo.createdAt,
      todo.updatedAt
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function todosToMarkdown(todos, title = 'Todo Export') {
  const lines = [`# ${title}`, '', `Generated: ${new Date().toISOString()}`, ''];

  todos.forEach((todo) => {
    const mark = todo.completed ? 'x' : ' ';
    const meta = [todo.priority, todo.status, todo.dueDate ? `due ${todo.dueDate}` : null]
      .filter(Boolean)
      .join(' | ');

    lines.push(`- [${mark}] ${todo.text}`);
    if (meta) {
      lines.push(`  - ${meta}`);
    }
    if (todo.tags?.length) {
      lines.push(`  - tags: ${todo.tags.join(', ')}`);
    }
    if (todo.description) {
      lines.push(`  - description: ${todo.description}`);
    }
    if (todo.notes) {
      lines.push('');
      lines.push('  ```md');
      lines.push(todo.notes);
      lines.push('  ```');
    }
  });

  return lines.join('\n');
}

export function todosToText(todos, title = 'Todo Export') {
  const lines = [title, '='.repeat(title.length), ''];

  todos.forEach((todo, index) => {
    const status = todo.completed ? '[x]' : '[ ]';
    lines.push(`${index + 1}. ${status} ${todo.text}`);
    if (todo.priority || todo.status || todo.dueDate) {
      lines.push(`   priority=${todo.priority} status=${todo.status} due=${todo.dueDate || 'none'}`);
    }
    if (todo.tags?.length) {
      lines.push(`   tags=${todo.tags.join(', ')}`);
    }
    if (todo.description) {
      lines.push(`   ${todo.description}`);
    }
  });

  return lines.join('\n');
}

function rowToTodo(row, listId, index) {
  const text = row.text || row.title || row.task || row.name || `Imported todo ${index + 1}`;
  return createTodo(text, listId, {
    completed: String(row.completed || '').toLowerCase() === 'true' || String(row.completed || '').toLowerCase() === 'x',
    priority: row.priority || 'medium',
    status: row.status || 'todo',
    dueDate: row.dueDate || row.due || null,
    tags: normalizeTags(row.tags),
    description: row.description || '',
    category: row.category || '',
    estimateMinutes: Number.isFinite(Number(row.estimateMinutes)) ? Number(row.estimateMinutes) : null,
    actualMinutes: Number.isFinite(Number(row.actualMinutes)) ? Number(row.actualMinutes) : 0,
    notes: row.notes || '',
    links: normalizeLinks(row.links)
  });
}

export function importTodosFromJson(text, listId) {
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed)) {
    return parsed.map((row, index) => {
      if (typeof row === 'string') {
        return createTodo(row, listId, { order: index });
      }
      return rowToTodo(row || {}, listId, index);
    });
  }

  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.todos)) {
    return parsed.todos.map((row, index) => rowToTodo(row || {}, listId, index));
  }

  throw new Error('JSON import expects an array of todos or an object with a todos array.');
}

export function importTodosFromCsv(text, listId) {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return [];
  }
  return rows.map((row, index) => rowToTodo(row, listId, index));
}

export function importTodosFromMarkdown(text, listId) {
  const lines = text.split(/\r?\n/);
  const todos = [];

  lines.forEach((line) => {
    const match = line.match(/^\s*-\s*\[( |x|X)\]\s+(.+)$/);
    if (!match) {
      return;
    }
    todos.push(
      createTodo(match[2], listId, {
        completed: match[1].toLowerCase() === 'x'
      })
    );
  });

  if (todos.length > 0) {
    return todos.map((todo, index) => ({ ...todo, order: index }));
  }

  const fallback = lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line, index) => createTodo(line, listId, { order: index }));

  return fallback;
}

export function importTodosFromText(text, listId) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const clean = line.replace(/^\d+\.\s*/, '').replace(/^\[.?\]\s*/, '');
      return createTodo(clean, listId, {
        order: index,
        completed: /^\[x\]/i.test(line)
      });
    });
}

export function importOpmlToGraph(text) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const parserError = xml.querySelector('parsererror');
  if (parserError) {
    throw new Error('Could not parse OPML file.');
  }

  const nodes = [];
  const edges = [];

  function walkOutline(element, parentId = null) {
    const label = element.getAttribute('text') || element.getAttribute('title') || 'Node';
    const nodeId = makeId('node');
    nodes.push({
      id: nodeId,
      label,
      x: 0,
      y: nodes.length * 40,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (parentId) {
      edges.push({
        id: makeId('edge'),
        from: parentId,
        to: nodeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    [...element.children]
      .filter((child) => child.tagName.toLowerCase() === 'outline')
      .forEach((child) => walkOutline(child, nodeId));
  }

  const body = xml.querySelector('body');
  if (!body) {
    return { nodes: [], edges: [] };
  }

  [...body.children]
    .filter((child) => child.tagName.toLowerCase() === 'outline')
    .forEach((outline) => walkOutline(outline, null));

  return { nodes, edges };
}

export async function parseImportFile(file, listId) {
  const text = await file.text();
  const ext = file.name.toLowerCase().split('.').pop() || '';

  if (ext === 'json' || ext === 'todo') {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && Number(parsed.schemaVersion) >= 1 && Array.isArray(parsed.lists)) {
      return {
        kind: 'workspace',
        fileName: file.name,
        payload: parsed,
        previewCount: Array.isArray(parsed.todos) ? parsed.todos.length : 0
      };
    }

    const todos = importTodosFromJson(text, listId);
    return {
      kind: 'todos',
      fileName: file.name,
      format: 'json',
      todos,
      previewCount: todos.length
    };
  }

  if (ext === 'csv') {
    const todos = importTodosFromCsv(text, listId);
    return {
      kind: 'todos',
      fileName: file.name,
      format: 'csv',
      todos,
      previewCount: todos.length
    };
  }

  if (ext === 'md' || ext === 'markdown') {
    const todos = importTodosFromMarkdown(text, listId);
    return {
      kind: 'todos',
      fileName: file.name,
      format: 'markdown',
      todos,
      previewCount: todos.length
    };
  }

  if (ext === 'txt') {
    const todos = importTodosFromText(text, listId);
    return {
      kind: 'todos',
      fileName: file.name,
      format: 'text',
      todos,
      previewCount: todos.length
    };
  }

  if (ext === 'opml') {
    const graph = importOpmlToGraph(text);
    return {
      kind: 'graph',
      fileName: file.name,
      payload: graph,
      previewCount: graph.nodes.length
    };
  }

  throw new Error(`Unsupported import format for ${file.name}`);
}

export function ensureWorkspaceShape(payload) {
  if (!payload || typeof payload !== 'object') {
    return createWorkspace();
  }
  return payload;
}
