import {
  createTodo,
  createWorkspace,
  makeId,
} from "./workspace";
import type { Todo, Workspace } from "./workspace";

export type ImportPreview =
  | {
      kind: "workspace";
      fileName: string;
      payload: Workspace;
      previewCount: number;
    }
  | {
      kind: "todos";
      fileName: string;
      format: "json" | "csv" | "markdown" | "text";
      todos: Todo[];
      previewCount: number;
    };

function escapeCsv(value: unknown): string {
  const text = value == null ? "" : String(value);
  const needsQuotes =
    text.includes(",") || text.includes('"') || text.includes("\n");
  const escaped = text.replaceAll('"', '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
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

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    throw new Error("Malformed CSV row: unmatched quote.");
  }

  result.push(current);
  return result;
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((entry) => entry.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function normalizeTags(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[;,|]/)
    .map((entry: string) => entry.trim())
    .filter(Boolean);
}

function normalizeLinks(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  return String(value)
    .split(/\s+/)
    .map((entry: string) => entry.trim())
    .filter(Boolean);
}

function toPriority(value: unknown): Todo["priority"] {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }
  return "medium";
}

function toStatus(value: unknown): Todo["status"] {
  if (
    value === "todo" ||
    value === "doing" ||
    value === "done" ||
    value === "blocked"
  ) {
    return value;
  }
  return "todo";
}

export function todosToJson(todos: Todo[]): string {
  return JSON.stringify(todos, null, 2);
}

export function todosToCsv(todos: Todo[]): string {
  const headers: string[] = [
    "id",
    "text",
    "completed",
    "priority",
    "status",
    "dueDate",
    "tags",
    "description",
    "category",
    "estimateMinutes",
    "actualMinutes",
    "notes",
    "links",
    "createdAt",
    "updatedAt",
  ];

  const rows = todos.map((todo) =>
    [
      todo.id,
      todo.text,
      todo.completed,
      todo.priority,
      todo.status,
      todo.dueDate || "",
      todo.tags.join("|"),
      todo.description,
      todo.category,
      todo.estimateMinutes ?? "",
      todo.actualMinutes,
      todo.notes,
      todo.links.join("|"),
      todo.createdAt,
      todo.updatedAt,
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

export function todosToMarkdown(
  todos: Todo[],
  title: string = "Todo Export",
): string {
  const lines: string[] = [
    `# ${title}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
  ];

  todos.forEach((todo) => {
    const mark = todo.completed ? "x" : " ";
    const meta = [
      todo.priority,
      todo.status,
      todo.dueDate ? `due ${todo.dueDate}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    lines.push(`- [${mark}] ${todo.text}`);
    if (meta) {
      lines.push(`  - ${meta}`);
    }
    if (todo.tags.length > 0) {
      lines.push(`  - tags: ${todo.tags.join(", ")}`);
    }
    if (todo.description) {
      lines.push(`  - description: ${todo.description}`);
    }
    if (todo.notes) {
      lines.push("");
      lines.push("  ```md");
      lines.push(todo.notes);
      lines.push("  ```");
    }
  });

  return lines.join("\n");
}

export function todosToText(
  todos: Todo[],
  title: string = "Todo Export",
): string {
  const lines: string[] = [title, "=".repeat(title.length), ""];

  todos.forEach((todo, index) => {
    const status = todo.completed ? "[x]" : "[ ]";
    lines.push(`${index + 1}. ${status} ${todo.text}`);
    if (todo.priority || todo.status || todo.dueDate) {
      lines.push(
        `   priority=${todo.priority} status=${todo.status} due=${todo.dueDate || "none"}`,
      );
    }
    if (todo.tags.length > 0) {
      lines.push(`   tags=${todo.tags.join(", ")}`);
    }
    if (todo.description) {
      lines.push(`   ${todo.description}`);
    }
  });

  return lines.join("\n");
}

function rowToTodo(
  row: Record<string, unknown>,
  listId: string,
  index: number,
): Todo {
  const text =
    (typeof row.text === "string" && row.text) ||
    (typeof row.title === "string" && row.title) ||
    (typeof row.task === "string" && row.task) ||
    (typeof row.name === "string" && row.name) ||
    `Imported todo ${index + 1}`;

  return createTodo(text, listId, {
    completed:
      String(row.completed || "").toLowerCase() === "true" ||
      String(row.completed || "").toLowerCase() === "x",
    priority: toPriority(row.priority),
    status: toStatus(row.status),
    dueDate:
      typeof row.dueDate === "string"
        ? row.dueDate
        : typeof row.due === "string"
          ? row.due
          : null,
    tags: normalizeTags(row.tags),
    description: typeof row.description === "string" ? row.description : "",
    category: typeof row.category === "string" ? row.category : "",
    estimateMinutes: Number.isFinite(Number(row.estimateMinutes))
      ? Number(row.estimateMinutes)
      : null,
    actualMinutes: Number.isFinite(Number(row.actualMinutes))
      ? Number(row.actualMinutes)
      : 0,
    notes: typeof row.notes === "string" ? row.notes : "",
    links: normalizeLinks(row.links),
    order: index,
  });
}

export function importTodosFromJson(text: string, listId: string): Todo[] {
  const parsed = JSON.parse(text) as unknown;

  if (Array.isArray(parsed)) {
    return parsed.map((row, index) => {
      if (typeof row === "string") {
        return createTodo(row, listId, { order: index });
      }
      const record =
        typeof row === "object" && row !== null
          ? (row as Record<string, unknown>)
          : {};
      return rowToTodo(record, listId, index);
    });
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as Record<string, unknown>).todos)
  ) {
    const rows = (parsed as Record<string, unknown>).todos as unknown[];
    return rows.map((row, index) => {
      const record =
        typeof row === "object" && row !== null
          ? (row as Record<string, unknown>)
          : {};
      return rowToTodo(record, listId, index);
    });
  }

  throw new Error(
    "JSON import expects an array of todos or an object with a todos array.",
  );
}

export function importTodosFromCsv(text: string, listId: string): Todo[] {
  const rows = parseCsv(text);
  return rows.map((row, index) => rowToTodo(row, listId, index));
}

export function importTodosFromMarkdown(text: string, listId: string): Todo[] {
  const lines = text.split(/\r?\n/);
  const todos: Todo[] = [];

  lines.forEach((line) => {
    const match = line.match(/^\s*-\s*\[( |x|X)\]\s+(.+)$/);
    if (!match) {
      return;
    }

    todos.push(
      createTodo(match[2], listId, {
        completed: match[1].toLowerCase() === "x",
      }),
    );
  });

  if (todos.length > 0) {
    return todos.map((todo, index) => ({ ...todo, order: index }));
  }

  return lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line, index) => createTodo(line, listId, { order: index }));
}

export function importTodosFromText(text: string, listId: string): Todo[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const clean = line.replace(/^\d+\.\s*/, "").replace(/^\[.?\]\s*/, "");
      return createTodo(clean, listId, {
        order: index,
        completed: /^\[x\]/i.test(line),
      });
    });
}

export async function parseImportFile(
  file: File,
  listId: string,
): Promise<ImportPreview> {
  const text = await file.text();
  const ext = file.name.toLowerCase().split(".").pop() || "";

  if (ext === "json" || ext === "todo") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Could not parse JSON in ${file.name}.`);
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Number((parsed as Record<string, unknown>).schemaVersion) >= 1 &&
      Array.isArray((parsed as Record<string, unknown>).lists)
    ) {
      return {
        kind: "workspace",
        fileName: file.name,
        payload: parsed as Workspace,
        previewCount: Array.isArray((parsed as Record<string, unknown>).todos)
          ? ((parsed as Record<string, unknown>).todos as unknown[]).length
          : 0,
      };
    }

    const todos = importTodosFromJson(text, listId);
    return {
      kind: "todos",
      fileName: file.name,
      format: "json",
      todos,
      previewCount: todos.length,
    };
  }

  if (ext === "csv") {
    const todos = importTodosFromCsv(text, listId);
    return {
      kind: "todos",
      fileName: file.name,
      format: "csv",
      todos,
      previewCount: todos.length,
    };
  }

  if (ext === "md" || ext === "markdown") {
    const todos = importTodosFromMarkdown(text, listId);
    return {
      kind: "todos",
      fileName: file.name,
      format: "markdown",
      todos,
      previewCount: todos.length,
    };
  }

  if (ext === "txt") {
    const todos = importTodosFromText(text, listId);
    return {
      kind: "todos",
      fileName: file.name,
      format: "text",
      todos,
      previewCount: todos.length,
    };
  }

  throw new Error(`Unsupported import format for ${file.name}`);
}

export function ensureWorkspaceShape(payload: unknown): Workspace {
  if (!payload || typeof payload !== "object") {
    return createWorkspace();
  }
  return payload as Workspace;
}
