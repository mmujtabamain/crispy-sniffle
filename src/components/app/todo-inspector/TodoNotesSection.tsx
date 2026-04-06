import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Todo } from "../../../lib/workspace";

interface TodoNotesSectionProps {
  todo: Todo;
  onPatch: (todoId: string, patch: Partial<Todo>) => void;
}

export default function TodoNotesSection({
  todo,
  onPatch,
}: TodoNotesSectionProps) {
  return (
    <>
      <label>
        Notes (Markdown)
        <textarea
          rows={5}
          value={todo.notes || ""}
          onChange={(event) => onPatch(todo.id, { notes: event.target.value })}
          placeholder="Use markdown, including inline code like `npm run dev`."
        />
      </label>

      {todo.notes ? (
        <div className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-[0.7rem] p-2 bg-[color-mix(in_oklch,var(--surface),white_8%)] text-sm">
          <p className="text-sm text-[var(--ink-1)]">Preview</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {todo.notes}
          </ReactMarkdown>
        </div>
      ) : null}
    </>
  );
}
