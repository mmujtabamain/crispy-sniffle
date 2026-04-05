import type { ReactNode } from "react";

interface PanelSectionProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

export default function PanelSection({
  title,
  className = "",
  children,
}: PanelSectionProps) {
  const classes = ["grid gap-2 rounded-2xl p-3 bg-[var(--surface)] border border-[color-mix(in_oklch,var(--line),transparent_20%)] shadow-[var(--shadow)]", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
