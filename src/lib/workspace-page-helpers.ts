import { makeId } from './workspace';

export const DEFAULT_EXPORT_FILE_STEM = 'taskscape-export';
export const DEFAULT_TIMER_SECONDS = 25 * 60;

/**
 * @param {object} workspace - Workspace object containing at least a `meta` object.
 * @returns {object} Workspace clone with a fresh `meta.updatedAt` timestamp.
 */
export function stampWorkspace(workspace) {
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
 * @param {Array<object>} allTodos - Full todo collection across all lists.
 * @param {string} listId - List identifier to replace.
 * @param {Array<object>} listTodos - Todos that belong to the target list.
 * @returns {Array<object>} Combined todo array with normalized ordering for the target list.
 */
export function mergeListTodos(allTodos, listId, listTodos) {
  const outsideList = allTodos.filter((todo) => todo.listId !== listId);
  const normalized = listTodos.map((todo, index) => ({
    ...todo,
    listId,
    order: index,
    updatedAt: todo.updatedAt || new Date().toISOString()
  }));

  return [...outsideList, ...normalized];
}

/**
 * @param {string} raw - Comma-separated tag string from user input.
 * @returns {string[]} Trimmed non-empty tag values.
 */
export function parseTagInput(raw) {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * @param {string} content - Text payload to save.
 * @param {string} fileName - Download filename including extension.
 * @param {string} [mimeType] - Blob mime type.
 * @returns {void}
 */
export function downloadTextFile(content, fileName, mimeType = 'text/plain;charset=utf-8') {
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
 * @param {File} file - Browser File object selected by the user.
 * @param {object} [options] - Attachment conversion options.
 * @param {(prefix: string) => string} [options.idFactory] - ID generator compatible with `makeId`.
 * @param {number} [options.maxPreviewBytes] - Maximum image size for inline preview generation.
 * @returns {Promise<object>} Attachment object containing metadata and optional preview URL.
 */
export async function fileToAttachment(
  file,
  { idFactory = makeId, maxPreviewBytes = 320 * 1024 } = {}
) {
  const isImage = file.type.startsWith('image/');
  let previewUrl = null;

  if (isImage && file.size <= maxPreviewBytes) {
    previewUrl = await new Promise((resolve, reject) => {
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
