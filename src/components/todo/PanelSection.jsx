export default function PanelSection({ title, className = '', children }) {
  const classes = ['panel', className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
