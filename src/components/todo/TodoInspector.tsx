import { Clock3, Link as LinkIcon, Pause, Play, Plus, TimerReset, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Attachment, Subtask, Todo } from '../../lib/workspace';

interface TimerState {
  todoId: string | null;
  running: boolean;
  remainingSec: number;
}

interface TodoInspectorProps {
  todo: Todo | null;
  timer: TimerState;
  onPatch: (todoId: string, patch: Partial<Todo>) => void;
  onAddSubtask: (todoId: string, text: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  onAttachFiles: (todoId: string, files: File[]) => Promise<void>;
  onStartTimer: (todoId: string) => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
}

function toTagString(tags: string[]): string {
  return (tags || []).join(', ');
}

function toLinksString(links: string[]): string {
  return (links || []).join('\n');
}

export default function TodoInspector({
  todo,
  timer,
  onPatch,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAttachFiles,
  onStartTimer,
  onStopTimer,
  onResetTimer
}: TodoInspectorProps) {
  if (!todo) {
    return (
      <aside className="inspector-panel">
        <h3>Todo Details</h3>
        <p className="meta-line">Select a task to edit Tier 2 properties, notes, tags, links, and subtasks.</p>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel">
      <h3>Todo Details</h3>

      <label>
        Title
        <input
          value={todo.text}
            onChange={(event) => onPatch(todo.id, { text: event.target.value })}
          placeholder="Task title"
        />
      </label>

      <div className="inspector-row two">
        <label>
          Priority
          <select
            value={todo.priority}
            onChange={(event) => onPatch(todo.id, { priority: event.target.value as Todo['priority'] })}
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
            onChange={(event) => onPatch(todo.id, { status: event.target.value as Todo['status'] })}
          >
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
      </div>

      <div className="inspector-row two">
        <label>
          Due date
          <input
            type="date"
            value={todo.dueDate || ''}
            onChange={(event) => onPatch(todo.id, { dueDate: event.target.value || null })}
          />
        </label>

        <label>
          Recurring
          <select
            value={todo.recurrence}
            onChange={(event) => onPatch(todo.id, { recurrence: event.target.value as Todo['recurrence'] })}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
      </div>

      <div className="inspector-row two">
        <label>
          Category
          <input
            value={todo.category || ''}
            onChange={(event) => onPatch(todo.id, { category: event.target.value })}
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
                  .split(',')
                  .map((tag: string) => tag.trim())
                  .filter(Boolean)
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
            value={todo.estimateMinutes ?? ''}
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
          value={todo.description || ''}
          onChange={(event) => onPatch(todo.id, { description: event.target.value })}
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
                .map((line: string) => line.trim())
                .filter(Boolean)
            })
          }
          placeholder="https://example.com"
        />
      </label>

      <div className="inspector-links">
        {(todo.links || []).map((link: string) => (
          <a key={link} href={link} target="_blank" rel="noreferrer">
            <LinkIcon size={13} /> {link}
          </a>
        ))}
      </div>

      <label>
        Notes (Markdown)
        <textarea
          rows={5}
          value={todo.notes || ''}
          onChange={(event) => onPatch(todo.id, { notes: event.target.value })}
          placeholder="Use markdown, including inline code like `npm run dev`."
        />
      </label>

      {todo.notes && (
        <div className="markdown-preview">
          <p className="meta-line">Preview</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{todo.notes}</ReactMarkdown>
        </div>
      )}

      <section className="inspector-block">
        <div className="inspector-block-header">
          <h4>Subtasks</h4>
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              const text = window.prompt('New subtask');
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
              <button type="button" className="ghost-button danger" onClick={() => onDeleteSubtask(todo.id, subtask.id)}>
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      </section>

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
                event.target.value = '';
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
              {attachment.previewUrl && <img src={attachment.previewUrl} alt={attachment.name} />}
            </li>
          ))}
        </ul>
      </section>

      <section className="inspector-block">
        <div className="inspector-block-header">
          <h4>Pomodoro Timer</h4>
          <span className="meta-line">{timer.todoId === todo.id ? `${Math.ceil(timer.remainingSec / 60)}m left` : 'idle'}</span>
        </div>
        <div className="timer-row">
          <button type="button" className="secondary-button" onClick={() => onStartTimer(todo.id)}>
            <Play size={14} /> Start 25m
          </button>
          <button type="button" className="secondary-button" onClick={onStopTimer}>
            <Pause size={14} /> Stop
          </button>
          <button type="button" className="secondary-button" onClick={onResetTimer}>
            <TimerReset size={14} /> Reset
          </button>
          <span className="timer-badge">
            <Clock3 size={13} /> {todo.actualMinutes || 0}m tracked
          </span>
        </div>
      </section>
    </aside>
  );
}
