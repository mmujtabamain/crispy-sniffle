import type { Todo } from "../../lib/workspace";
import type { TimerState } from "../../features/workspace/types";
import TodoAttachmentsSection from "./todo-inspector/TodoAttachmentsSection";
import TodoDetailsForm from "./todo-inspector/TodoDetailsForm";
import TodoInspectorEmptyState from "./todo-inspector/EmptyState";
import TodoLinksPreview from "./todo-inspector/TodoLinksPreview";
import TodoNotesSection from "./todo-inspector/TodoNotesSection";
import TodoSubtasksSection from "./todo-inspector/TodoSubtasksSection";
import TodoTimerSection from "./todo-inspector/TodoTimerSection";

export interface TodoInspectorProps {
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
  onResetTimer,
}: TodoInspectorProps) {
  if (!todo) {
    return <TodoInspectorEmptyState />;
  }

  return (
    <aside className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-[0.88rem] bg-[var(--surface)] shadow-[var(--shadow)] p-3 grid gap-2">
      <h3>Todo Details</h3>

      <TodoDetailsForm todo={todo} onPatch={onPatch} />
      <TodoLinksPreview links={todo.links || []} />
      <TodoNotesSection todo={todo} onPatch={onPatch} />
      <TodoSubtasksSection
        todo={todo}
        onAddSubtask={onAddSubtask}
        onToggleSubtask={onToggleSubtask}
        onDeleteSubtask={onDeleteSubtask}
      />
      <TodoAttachmentsSection todo={todo} onAttachFiles={onAttachFiles} />
      <TodoTimerSection
        todo={todo}
        timer={timer}
        onStartTimer={onStartTimer}
        onStopTimer={onStopTimer}
        onResetTimer={onResetTimer}
      />
    </aside>
  );
}
