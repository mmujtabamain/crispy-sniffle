import { Clock3, Pause, Play, TimerReset } from "lucide-react";
import type { Todo } from "../../../lib/workspace";
import type { TimerState } from "../../../features/workspace/types";

interface TodoTimerSectionProps {
  todo: Todo;
  timer: TimerState;
  onStartTimer: (todoId: string) => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
}

export default function TodoTimerSection({
  todo,
  timer,
  onStartTimer,
  onStopTimer,
  onResetTimer,
}: TodoTimerSectionProps) {
  return (
    <section className="border-t border-dashed border-[color-mix(in_oklch,var(--line),transparent_22%)] pt-2 grid gap-2">
      <div className="flex justify-between items-center gap-2">
        <h4>Pomodoro Timer</h4>
        <span className="text-sm text-[var(--ink-1)]">
          {timer.todoId === todo.id
            ? `${Math.ceil(timer.remainingSec / 60)}m left`
            : "idle"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={() => onStartTimer(todo.id)}
        >
          <Play size={14} /> Start 25m
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onStopTimer}
        >
          <Pause size={14} /> Stop
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={onResetTimer}
        >
          <TimerReset size={14} /> Reset
        </button>
        <span className="inline-flex items-center gap-1 text-[var(--ink-soft)] text-sm">
          <Clock3 size={13} /> {todo.actualMinutes || 0}m tracked
        </span>
      </div>
    </section>
  );
}
