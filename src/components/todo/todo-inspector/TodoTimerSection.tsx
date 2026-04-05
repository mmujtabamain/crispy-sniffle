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
    <section className="inspector-block">
      <div className="inspector-block-header">
        <h4>Pomodoro Timer</h4>
        <span className="meta-line">
          {timer.todoId === todo.id
            ? `${Math.ceil(timer.remainingSec / 60)}m left`
            : "idle"}
        </span>
      </div>
      <div className="timer-row">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onStartTimer(todo.id)}
        >
          <Play size={14} /> Start 25m
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onStopTimer}
        >
          <Pause size={14} /> Stop
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onResetTimer}
        >
          <TimerReset size={14} /> Reset
        </button>
        <span className="timer-badge">
          <Clock3 size={13} /> {todo.actualMinutes || 0}m tracked
        </span>
      </div>
    </section>
  );
}
