import type { Todo } from "../../../lib/workspace";
import { toLinksString, toTagString } from "./helpers";

interface TodoDetailsFormProps {
  todo: Todo;
  onPatch: (todoId: string, patch: Partial<Todo>) => void;
}

export default function TodoDetailsForm({
  todo,
  onPatch,
}: TodoDetailsFormProps) {
  return (
    <>
      <label>
        Title
        <input
          value={todo.text}
          onChange={(event) => onPatch(todo.id, { text: event.target.value })}
          placeholder="Task title"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label>
          Priority
          <select
            value={todo.priority}
            onChange={(event) =>
              onPatch(todo.id, {
                priority: event.target.value as Todo["priority"],
              })
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={todo.status}
            onChange={(event) =>
              onPatch(todo.id, { status: event.target.value as Todo["status"] })
            }
          >
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>
          Due date
          <input
            type="date"
            value={todo.dueDate || ""}
            onChange={(event) =>
              onPatch(todo.id, { dueDate: event.target.value || null })
            }
          />
        </label>

        <label>
          Recurring
          <select
            value={todo.recurrence}
            onChange={(event) =>
              onPatch(todo.id, {
                recurrence: event.target.value as Todo["recurrence"],
              })
            }
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>
          Category
          <input
            value={todo.category || ""}
            onChange={(event) =>
              onPatch(todo.id, { category: event.target.value })
            }
            placeholder="Category"
          />
        </label>

        <label>
          Tags
          <input
            value={toTagString(todo.tags)}
            onChange={(event) =>
              onPatch(todo.id, {
                tags: event.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
            placeholder="design, launch"
          />
        </label>
      </div>

      <div className="inspector-row two">
        <label>
          Est. minutes
          <input
            type="number"
            min={0}
            value={todo.estimateMinutes ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              onPatch(todo.id, { estimateMinutes: next ? Number(next) : null });
            }}
            placeholder="25"
          />
        </label>

        <label>
          Actual minutes
          <input
            type="number"
            min={0}
            value={todo.actualMinutes ?? 0}
            onChange={(event) => {
              const next = event.target.value;
              onPatch(todo.id, { actualMinutes: next ? Number(next) : 0 });
            }}
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          rows={3}
          value={todo.description || ""}
          onChange={(event) =>
            onPatch(todo.id, { description: event.target.value })
          }
          placeholder="Short description"
        />
      </label>

      <label>
        Links (one URL per line)
        <textarea
          rows={3}
          value={toLinksString(todo.links)}
          onChange={(event) =>
            onPatch(todo.id, {
              links: event.target.value
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
          placeholder="https://example.com"
        />
      </label>
    </>
  );
}
