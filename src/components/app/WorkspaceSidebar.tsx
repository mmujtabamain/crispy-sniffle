import { useEffect, useId } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  PanelsTopLeft,
  SlidersHorizontal,
} from "lucide-react";
import AutoBackupPanel from "./workspace-sidebar/AutoBackupPanel";
import DangerZonePanel from "./workspace-sidebar/DangerZonePanel";
import ExportPanel from "./workspace-sidebar/ExportPanel";
import ImportPanel from "./workspace-sidebar/ImportPanel";
import PersistencePanel from "./workspace-sidebar/PersistencePanel";
import RecentFilesPanel from "./workspace-sidebar/RecentFilesPanel";
import WorkspaceSummaryPanel from "./workspace-sidebar/WorkspaceSummaryPanel";
import type { WorkspaceSidebarProps } from "./workspace-sidebar/types";

export type { WorkspaceSidebarProps } from "./workspace-sidebar/types";

function RailButton({
  active = false,
  collapsed,
  label,
  detail,
  icon,
  onClick,
  expanded,
}: {
  active?: boolean;
  collapsed: boolean;
  label: string;
  detail: string;
  icon: ReactNode;
  onClick?: () => void;
  expanded?: boolean;
}) {
  const classes = `flex w-full items-center gap-3 rounded-[1.2rem] border px-3 py-3 text-left transition-all ${
    active
      ? "border-[color-mix(in_oklch,var(--accent),var(--line)_24%)] bg-[color-mix(in_oklch,var(--accent-soft)_80%,var(--surface))] text-[var(--ink-0)]"
      : "border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_12%)] hover:bg-[color-mix(in_oklch,var(--surface),white_18%)]"
  } ${collapsed ? "justify-center px-2.5" : ""}`;
  const content = (
    <>
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border ${
          active
            ? "border-[color-mix(in_oklch,var(--accent),transparent_36%)] bg-[color-mix(in_oklch,var(--accent-soft),white_12%)]"
            : "border-[color-mix(in_oklch,var(--line),transparent_10%)] bg-[color-mix(in_oklch,var(--surface),white_8%)]"
        }`}
      >
        {icon}
      </span>

      {!collapsed ? (
        <span className="grid min-w-0">
          <span className="text-sm font-semibold">{label}</span>
          <span className="truncate text-xs text-[var(--ink-soft)]">
            {detail}
          </span>
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        aria-expanded={typeof expanded === "boolean" ? expanded : undefined}
        title={collapsed ? label : undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={classes} title={collapsed ? label : undefined}>
      {content}
    </div>
  );
}

export default function WorkspaceSidebar({
  rail,
  workspaceSummary,
  persistencePanel,
  autoBackupPanel,
  importPanel,
  exportPanel,
  recentFilesPanel,
  dangerZonePanel,
}: WorkspaceSidebarProps) {
  const propertiesTitleId = useId();

  useEffect(() => {
    if (!rail.propertiesOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        rail.onCloseProperties();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rail.propertiesOpen, rail.onCloseProperties]);

  return (
    <aside
      className={`relative z-30 flex flex-col h-full border-r border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_12%)] shadow-[0_2px_8px_color-mix(in_oklch,var(--ink-0)_4%,transparent)] backdrop-blur-xl transition-[width] duration-300 ease-out ${
        rail.propertiesOpen
          ? "w-[19rem]"
          : rail.collapsed
            ? "w-[5.5rem]"
            : "w-[15rem]"
      }`}
    >
      {rail.propertiesOpen ? (
        /* Properties view — renders inline in the sidebar */
        <div className="flex flex-col h-full">
          {/* Properties header */}
          <div className="flex items-center gap-2 border-b border-[color-mix(in_oklch,var(--line),transparent_20%)] p-3 shrink-0">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[0.9rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),white_18%)] active:translate-y-0 shrink-0"
              onClick={rail.onCloseProperties}
              aria-label="Back to tasks"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="grid min-w-0">
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
                Workspace
              </span>
              <h2
                id={propertiesTitleId}
                className="truncate text-sm font-semibold leading-tight"
              >
                Properties
              </h2>
            </div>
          </div>

          {/* Properties panels — scrollable */}
          <div
            role="region"
            aria-labelledby={propertiesTitleId}
            className="flex-1 overflow-y-auto p-3 grid gap-2 content-start"
          >
            <WorkspaceSummaryPanel {...workspaceSummary} />
            <PersistencePanel {...persistencePanel} />
            <AutoBackupPanel {...autoBackupPanel} />
            <ImportPanel {...importPanel} />
            <ExportPanel {...exportPanel} />
            <RecentFilesPanel {...recentFilesPanel} />
            <DangerZonePanel {...dangerZonePanel} />
          </div>
        </div>
      ) : (
        /* Tasks (rail) view */
        <div className="flex flex-col justify-between h-full p-3 gap-3">
          <div className="grid gap-3">
            {/* Brand header */}
            <div
              className={`flex items-center gap-2 ${
                rail.collapsed ? "justify-center" : "justify-between"
              }`}
            >
              <div
                className={`flex min-w-0 items-center gap-3 ${
                  rail.collapsed ? "justify-center" : ""
                }`}
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[color-mix(in_oklch,var(--line),transparent_8%)] bg-[color-mix(in_oklch,var(--accent-soft)_68%,var(--surface))]">
                  <PanelsTopLeft size={18} />
                </span>
                {!rail.collapsed ? (
                  <span className="grid min-w-0">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
                      Dashboard
                    </span>
                    <span className="truncate text-sm font-semibold">
                      TaskScape
                    </span>
                  </span>
                ) : null}
              </div>

              {!rail.collapsed ? (
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),white_18%)] active:translate-y-0"
                  onClick={rail.onToggleCollapsed}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              ) : null}
            </div>

            {rail.collapsed ? (
              <button
                type="button"
                className="inline-flex h-9 w-9 justify-self-center items-center justify-center rounded-[0.9rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),white_18%)] active:translate-y-0"
                onClick={rail.onToggleCollapsed}
                aria-label="Expand sidebar"
              >
                <ChevronRight size={16} />
              </button>
            ) : null}

            {/* Nav buttons */}
            <div className="grid gap-2">
              <RailButton
                active
                collapsed={rail.collapsed}
                label="Tasks"
                detail={`${rail.visibleTodoCount} visible in ${rail.activeListName}`}
                icon={<ListTodo size={18} />}
              />
              <RailButton
                collapsed={rail.collapsed}
                label="Properties"
                detail="Lists, persistence, import and export"
                icon={<SlidersHorizontal size={18} />}
                onClick={rail.onOpenProperties}
                expanded={false}
              />
            </div>
          </div>

          {/* Active list card */}
          <div
            className={`rounded-[1.25rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] p-3 ${
              rail.collapsed ? "text-center" : ""
            }`}
          >
            <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
              Active list
            </div>
            {!rail.collapsed ? (
              <>
                <div className="mt-1 truncate text-sm font-semibold">
                  {rail.activeListName}
                </div>
                <div className="mt-1 text-xs text-[var(--ink-soft)]">
                  {rail.visibleTodoCount} visible of {rail.totalTodoCount}
                </div>
              </>
            ) : (
              <div className="mt-1 text-lg font-semibold">
                {rail.visibleTodoCount}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
