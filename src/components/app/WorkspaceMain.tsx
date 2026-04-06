import TodoInspector from "./TodoInspector";
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
  inspector,
}: WorkspaceMainProps) {
  return (
    <main className="grid gap-2">
      <WorkspaceAlerts {...alerts} />
      <TodoComposer {...composer} />
      <TodoFiltersPanel {...filtersPanel} />
      <TodoStatsRow {...stats} />
      <TodoPrimaryActions {...primaryActions} />
      {bulkActions ? <TodoBulkBar {...bulkActions} /> : null}
      <TodoListPanel {...todoList} />
      <TodoInspector {...inspector} />
      <ShortcutStrip />
    </main>
  );
}
