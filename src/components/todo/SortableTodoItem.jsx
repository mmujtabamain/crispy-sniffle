import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Check, Copy, Trash2 } from 'lucide-react';

export default function SortableTodoItem({
  todo,
  isEditing,
  editDraft,
  onDraftChange,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onToggle,
  onDuplicate,
  onDelete
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`todo-item ${todo.completed ? 'todo-complete' : ''}`}
    >
      <button
        type="button"
        className="grab-handle"
        aria-label="Reorder todo"
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>

      <label className="todo-check-wrap" title="Toggle complete">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark ${todo.text} as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        <span className="todo-check-mark" aria-hidden="true">
          <Check size={14} />
        </span>
      </label>

      <div className="todo-main" onDoubleClick={() => onBeginEdit(todo)}>
        {isEditing ? (
          <input
            className="todo-edit-input"
            value={editDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onCommitEdit();
              }
              if (event.key === 'Escape') {
                onCancelEdit();
              }
            }}
            autoFocus
            aria-label="Edit todo text"
          />
        ) : (
          <button type="button" className="todo-text-button" onClick={() => onBeginEdit(todo)}>
            <span className="todo-text">{todo.text}</span>
          </button>
        )}
      </div>

      <div className="todo-actions">
        <button type="button" className="ghost-button" onClick={() => onDuplicate(todo.id)} aria-label="Duplicate todo">
          <Copy size={15} />
        </button>
        <button type="button" className="ghost-button danger" onClick={() => onDelete(todo.id)} aria-label="Delete todo">
          <Trash2 size={15} />
        </button>
      </div>
    </motion.li>
  );
}
