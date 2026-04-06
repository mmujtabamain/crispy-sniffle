export default function TodoInspectorEmptyState() {
  return (
    <aside className="border border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-[0.88rem] bg-[var(--surface)] shadow-[var(--shadow)] p-3 grid gap-2">
      <h3>Todo Details</h3>
      <p className="text-sm text-[var(--ink-1)]">
        Select a task to edit Tier 2 properties, notes, tags, links, and
        subtasks.
      </p>
    </aside>
  );
}
