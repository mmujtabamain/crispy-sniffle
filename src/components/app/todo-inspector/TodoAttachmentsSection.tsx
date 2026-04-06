import { Plus } from "lucide-react";
import type { Attachment, Todo } from "../../../lib/workspace";

interface TodoAttachmentsSectionProps {
  todo: Todo;
  onAttachFiles: (todoId: string, files: File[]) => Promise<void>;
}

export default function TodoAttachmentsSection({
  todo,
  onAttachFiles,
}: TodoAttachmentsSectionProps) {
  return (
    <section className="border-t border-dashed border-[color-mix(in_oklch,var(--line),transparent_22%)] pt-2 grid gap-2">
      <div className="flex justify-between items-center gap-2">
        <h4>Attachments</h4>
        <label className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0 relative overflow-hidden">
          <Plus size={14} /> Attach files
          <input
            type="file"
            hidden
            multiple
            onChange={(event) => {
              const files = event.target.files ? [...event.target.files] : [];
              if (files.length > 0) {
                void onAttachFiles(todo.id, files);
              }
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <ul className="list-none grid gap-2">
        {(todo.attachments || []).map((attachment: Attachment) => (
          <li key={attachment.id}>
            <div>
              <strong>{attachment.name}</strong>
              <small>{Math.round((attachment.size || 0) / 1024)} KB</small>
            </div>
            {attachment.previewUrl ? (
              <img src={attachment.previewUrl} alt={attachment.name} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
