import ShortcutStrip from "./workspace-main/ShortcutStrip";
import TodoBulkBar from "./workspace-main/TodoBulkBar";
import TodoComposer from "./workspace-main/TodoComposer";
import TodoFiltersPanel from "./workspace-main/TodoFiltersPanel";
import TodoListPanel from "./workspace-main/TodoListPanel";
import TodoPrimaryActions from "./workspace-main/TodoPrimaryActions";
import TodoStatsRow from "./workspace-main/TodoStatsRow";
import WorkspaceAlerts from "./workspace-main/WorkspaceAlerts";
import type { WorkspaceMainProps } from "./workspace-main/types";

export type { WorkspaceMainProps } from "./workspace-main/types";

export default function WorkspaceMain({
  alerts,
  composer,
  filtersPanel,
  stats,
  primaryActions,
  bulkActions,
  todoList,
}: WorkspaceMainProps) {
  return (
    <main className="grid min-w-0 gap-2 overflow-y-auto flex-1 p-8 px-8 content-start">
      <WorkspaceAlerts {...alerts} />
      <TodoComposer {...composer} />
      <div
        className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
          filtersPanel.open
            ? "grid-rows-[1fr] opacity-100 translate-y-0"
            : "grid-rows-[0fr] opacity-0 -translate-y-2"
        }`}
        aria-hidden={!filtersPanel.open}
      >
        <div id="todo-filters-panel" className="min-h-0 overflow-hidden">
          <TodoFiltersPanel {...filtersPanel} />
        </div>
      </div>
      <TodoStatsRow {...stats} />
      <TodoPrimaryActions {...primaryActions} />
      {bulkActions ? <TodoBulkBar {...bulkActions} /> : null}
      <TodoListPanel {...todoList} />
      <ShortcutStrip />
    </main>
  );
}
