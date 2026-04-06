import { useEffect, useId } from "react";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PanelsTopLeft,
  SlidersHorizontal,
  X,
} from "lucide-react";
import AutoBackupPanel from "./workspace-sidebar/AutoBackupPanel";
import DangerZonePanel from "./workspace-sidebar/DangerZonePanel";
import ExportPanel from "./workspace-sidebar/ExportPanel";
import ImportPanel from "./workspace-sidebar/ImportPanel";
import ListsPanel from "./workspace-sidebar/ListsPanel";
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
  listsPanel,
  workspaceSummary,
  persistencePanel,
  autoBackupPanel,
  importPanel,
  exportPanel,
  recentFilesPanel,
  dangerZonePanel,
}: WorkspaceSidebarProps) {
  const drawerTitleId = useId();

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
    <aside className="relative z-30 w-full self-start lg:w-auto">
      {rail.propertiesOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-10 bg-[color-mix(in_oklch,var(--ink-0)_12%,transparent)] backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none"
          aria-label="Close properties drawer"
          onClick={rail.onCloseProperties}
        />
      ) : null}

      <div
        className={`z-20 flex min-h-0 flex-col justify-between rounded-[1.7rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_12%)] p-3 shadow-[0_24px_60px_color-mix(in_oklch,var(--ink-0)_18%,transparent)] backdrop-blur-xl transition-[width] duration-300 ease-out lg:sticky lg:top-3 lg:min-h-[calc(100vh-2rem)] ${
          rail.collapsed ? "w-full lg:w-[5.5rem]" : "w-full lg:w-[15rem]"
        }`}
      >
        <div className="grid gap-3">
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
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[color-mix(in_oklch,var(--line),transparent_8%)] bg-[color-mix(in_oklch,var(--accent-soft)_68%,var(--surface))]">
                <PanelsTopLeft size={18} />
              </span>
              {!rail.collapsed ? (
                <span className="grid min-w-0">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),white_18%)] active:translate-y-0"
                onClick={rail.onToggleCollapsed}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            ) : null}
          </div>

          {rail.collapsed ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 justify-self-center items-center justify-center rounded-[1rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),white_18%)] active:translate-y-0"
              onClick={rail.onToggleCollapsed}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          ) : null}

          <div className="grid gap-2">
            <RailButton
              active
              collapsed={rail.collapsed}
              label="Tasks"
              detail={`${rail.visibleTodoCount} visible in ${rail.activeListName}`}
              icon={<PanelsTopLeft size={18} />}
            />
            <RailButton
              collapsed={rail.collapsed}
              label="Properties"
              detail="Lists, persistence, import and export"
              icon={<SlidersHorizontal size={18} />}
              onClick={
                rail.propertiesOpen
                  ? rail.onCloseProperties
                  : rail.onOpenProperties
              }
              expanded={rail.propertiesOpen}
            />
          </div>
        </div>

        <div
          className={`rounded-[1.25rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] p-3 ${
            rail.collapsed ? "text-center" : ""
          }`}
        >
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
            Active list
          </div>
          {!rail.collapsed ? (
            <>
              <div className="mt-1 truncate text-sm font-semibold">
                {rail.activeListName}
              </div>
              <div className="mt-2 text-xs text-[var(--ink-soft)]">
                {rail.visibleTodoCount} visible of {rail.totalTodoCount}
              </div>
            </>
          ) : (
            <div className="mt-2 text-lg font-semibold">
              {rail.visibleTodoCount}
            </div>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-y-4 left-4 right-4 z-20 flex items-start lg:absolute lg:inset-y-auto lg:left-[calc(100%+1rem)] lg:right-auto lg:top-0 lg:w-[min(30rem,calc(100vw-18rem))] ${
          rail.propertiesOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={drawerTitleId}
          className={`flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-[1.8rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_14%)] p-3 shadow-[0_30px_72px_color-mix(in_oklch,var(--ink-0)_24%,transparent)] backdrop-blur-2xl transition-all duration-300 ease-out ${
            rail.propertiesOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-6 opacity-0"
          }`}
        >
          <div className="flex items-start justify-between gap-3 px-1 pb-3">
            <div className="grid gap-1">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                Workspace controls
              </p>
              <h2 id={drawerTitleId} className="text-[1.55rem]">
                Properties
              </h2>
              <p className="text-sm text-[var(--ink-soft)]">
                Press Esc or click outside to close.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] border border-[color-mix(in_oklch,var(--line),transparent_12%)] bg-[color-mix(in_oklch,var(--surface),white_10%)] transition-all hover:translate-y-[-1px] hover:bg-[color-mix(in_oklch,var(--surface),white_18%)] active:translate-y-0"
              onClick={rail.onCloseProperties}
              aria-label="Close properties drawer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-2 overflow-y-auto pr-1">
            <ListsPanel {...listsPanel} />
            <WorkspaceSummaryPanel {...workspaceSummary} />
            <PersistencePanel {...persistencePanel} />
            <AutoBackupPanel {...autoBackupPanel} />
            <ImportPanel {...importPanel} />
            <ExportPanel {...exportPanel} />
            <RecentFilesPanel {...recentFilesPanel} />
            <DangerZonePanel {...dangerZonePanel} />
          </div>
        </div>
      </div>
    </aside>
  );
}
