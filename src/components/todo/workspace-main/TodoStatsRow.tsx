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
    <div className="grid grid-cols-6 gap-2" aria-label="Todo counters">
      <div className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[color-mix(in_oklch,var(--surface),white_9%)] rounded-[0.8rem] p-2.5 grid">
        <strong className="font-serif text-[1.2rem]">{visibleCount}</strong>
        <span className="text-xs text-[var(--ink-soft)]">Visible</span>
      </div>
      <div className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[color-mix(in_oklch,var(--surface),white_9%)] rounded-[0.8rem] p-2.5 grid">
        <strong className="font-serif text-[1.2rem]">{totalCount}</strong>
        <span className="text-xs text-[var(--ink-soft)]">In {activeListName || "list"}</span>
      </div>
      <div className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[color-mix(in_oklch,var(--surface),white_9%)] rounded-[0.8rem] p-2.5 grid">
        <strong className="font-serif text-[1.2rem]">{completedCount}</strong>
        <span className="text-xs text-[var(--ink-soft)]">Completed</span>
      </div>
      <div className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[color-mix(in_oklch,var(--surface),white_9%)] rounded-[0.8rem] p-2.5 grid">
        <strong className="font-serif text-[1.2rem]">{pendingCount}</strong>
        <span className="text-xs text-[var(--ink-soft)]">Open</span>
      </div>
      <div className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[color-mix(in_oklch,var(--surface),white_9%)] rounded-[0.8rem] p-2.5 grid">
        <strong className="font-serif text-[1.2rem]">{archivedCount}</strong>
        <span className="text-xs text-[var(--ink-soft)]">Archived</span>
      </div>
      <div className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] bg-[color-mix(in_oklch,var(--surface),white_9%)] rounded-[0.8rem] p-2.5 grid">
        <strong className="font-serif text-[1.2rem]">{storageUsedLabel}</strong>
        <span className="text-xs text-[var(--ink-soft)]">Storage used</span>
      </div>
    </div>
  );
}
