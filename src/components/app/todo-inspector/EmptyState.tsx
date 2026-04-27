export default function TodoInspectorEmptyState() {
  return (
    <div className="border border-dashed border-[color-mix(in_oklch,var(--line),transparent_20%)] rounded-[0.88rem] bg-[color-mix(in_oklch,var(--surface),white_3%)] p-4 grid gap-2 text-center">
      <h3 className="text-sm font-semibold text-[var(--ink-1)]">No task selected</h3>
      <p className="text-xs text-[var(--ink-soft)]">
        Select a task to view and edit its details.
      </p>
    </div>
  );
}
