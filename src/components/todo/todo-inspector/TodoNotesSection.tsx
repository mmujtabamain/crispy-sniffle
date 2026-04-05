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
        <div className="markdown-preview">
          <p className="meta-line">Preview</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {todo.notes}
          </ReactMarkdown>
        </div>
      ) : null}
    </>
  );
}
