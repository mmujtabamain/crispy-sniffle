import { makeId } from './workspace';
import type { Workspace, Todo } from './workspace';

interface FileAttachmentOptions {
  idFactory?: (prefix: string) => string;
  maxPreviewBytes?: number;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl: string | null;
}

export const DEFAULT_EXPORT_FILE_STEM = 'taskscape-export';
export const DEFAULT_TIMER_SECONDS = 25 * 60;

/**
 * Stamps a workspace with a fresh updatedAt timestamp.
 * @param {Workspace} workspace - Workspace object containing at least a `meta` object.
 * @returns {Workspace} Workspace clone with a fresh `meta.updatedAt` timestamp.
 */
export function stampWorkspace(workspace: Workspace): Workspace {
  const timestamp = new Date().toISOString();
  return {
    ...workspace,
    meta: {
      ...workspace.meta,
      updatedAt: timestamp
    }
  };
}

/**
 * Merges list todos with other todos, normalizing order.
 * @param {Todo[]} allTodos - Full todo collection across all lists.
 * @param {string} listId - List identifier to replace.
 * @param {Todo[]} listTodos - Todos that belong to the target list.
 * @returns {Todo[]} Combined todo array with normalized ordering for the target list.
 */
export function mergeListTodos(allTodos: Todo[], listId: string, listTodos: Todo[]): Todo[] {
  const outsideList = allTodos.filter((todo: Todo) => todo.listId !== listId);
  const normalized = listTodos.map((todo: Todo, index: number) => ({
    ...todo,
    listId,
    order: index,
    updatedAt: todo.updatedAt || new Date().toISOString()
  }));

  return [...outsideList, ...normalized];
}

/**
 * Parses comma-separated tag input.
 * @param {string} raw - Comma-separated tag string from user input.
 * @returns {string[]} Trimmed non-empty tag values.
 */
export function parseTagInput(raw: string): string[] {
  return raw
    .split(',')
    .map((tag: string) => tag.trim())
    .filter(Boolean);
}

/**
 * Downloads text content as a file.
 * @param {string} content - Text payload to save.
 * @param {string} fileName - Download filename including extension.
 * @param {string} [mimeType] - Blob mime type.
 * @returns {void}
 */
export function downloadTextFile(content: string, fileName: string, mimeType: string = 'text/plain;charset=utf-8'): void {
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

/**
 * Converts a File to an Attachment object with optional preview.
 * @param {File} file - Browser File object selected by the user.
 * @param {FileAttachmentOptions} [options] - Attachment conversion options.
 * @returns {Promise<Attachment>} Attachment object containing metadata and optional preview URL.
 */
export async function fileToAttachment(
  file: File,
  { idFactory = makeId, maxPreviewBytes = 320 * 1024 }: FileAttachmentOptions = {}
): Promise<Attachment> {
  const isImage = file.type.startsWith('image/');
  let previewUrl: string | null = null;

  if (isImage && file.size <= maxPreviewBytes) {
    previewUrl = await new Promise((resolve: (value: string | null) => void, reject: (reason: Error) => void) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => reject(new Error(`Could not read image preview for ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  return {
    id: idFactory('attachment'),
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size || 0,
    previewUrl
  };
}
