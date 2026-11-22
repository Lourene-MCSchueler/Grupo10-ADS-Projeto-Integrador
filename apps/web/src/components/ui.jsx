export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

export function StatusPill({ tone = 'info', icon, children }) {
  return (
    <span className={`status-pill ${tone}`}>
      {icon && <span aria-hidden="true">{icon} </span>}
      {children}
    </span>
  )
}

export function MetricCard({ label, value, hint, accent = false, tone }) {
  const classes = ['metric-card', accent && 'accent', tone && `tone-${tone}`].filter(Boolean)
  return (
    <article className={classes.join(' ')}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  )
}
