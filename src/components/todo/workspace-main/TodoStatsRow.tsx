import type { TodoStatsRowProps } from "./types";

export default function TodoStatsRow({
  visibleCount,
  totalCount,
  completedCount,
  pendingCount,
  archivedCount,
  activeListName,
  storageUsedLabel,
}: TodoStatsRowProps) {
  return (
    <div className="stats-row" aria-label="Todo counters">
      <div>
        <strong>{visibleCount}</strong>
        <span>Visible</span>
      </div>
      <div>
        <strong>{totalCount}</strong>
        <span>In {activeListName || "list"}</span>
      </div>
      <div>
        <strong>{completedCount}</strong>
        <span>Completed</span>
      </div>
      <div>
        <strong>{pendingCount}</strong>
        <span>Open</span>
      </div>
      <div>
        <strong>{archivedCount}</strong>
        <span>Archived</span>
      </div>
      <div>
        <strong>{storageUsedLabel}</strong>
        <span>Storage used</span>
      </div>
    </div>
  );
}
