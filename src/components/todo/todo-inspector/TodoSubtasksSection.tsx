import { Plus, Trash2 } from "lucide-react";
import type { Subtask, Todo } from "../../../lib/workspace";

interface TodoSubtasksSectionProps {
  todo: Todo;
  onAddSubtask: (todoId: string, text: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

export default function TodoSubtasksSection({
  todo,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TodoSubtasksSectionProps) {
  return (
    <section className="inspector-block">
      <div className="inspector-block-header">
        <h4>Subtasks</h4>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            const text = window.prompt("New subtask");
            if (text) {
              onAddSubtask(todo.id, text);
            }
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <ul className="subtask-list">
        {(todo.subtasks || []).map((subtask: Subtask) => (
          <li key={subtask.id}>
            <label>
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggleSubtask(todo.id, subtask.id)}
              />
              <span>{subtask.text}</span>
            </label>
            <button
              type="button"
              className="ghost-button danger"
              onClick={() => onDeleteSubtask(todo.id, subtask.id)}
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
