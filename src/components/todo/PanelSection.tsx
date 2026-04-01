import type { ReactNode } from 'react';

interface PanelSectionProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

export default function PanelSection({ title, className = '', children }: PanelSectionProps) {
  const classes = ['panel', className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
