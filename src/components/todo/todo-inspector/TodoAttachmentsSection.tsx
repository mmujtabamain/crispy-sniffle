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
    <section className="inspector-block">
      <div className="inspector-block-header">
        <h4>Attachments</h4>
        <label className="secondary-button file-button">
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

      <ul className="attachment-list">
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
