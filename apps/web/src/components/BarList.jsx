import { EmptyState } from './ui'

// Barras horizontais de uma série só (sem legenda: o título do painel nomeia a série).
// O valor fica escrito ao lado de cada barra, então a leitura não depende da cor.
export function BarList({ items, unit, emptyText }) {
  if (!items.length) return <EmptyState title="Sem dados" text={emptyText} />

  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li className="bar-row" key={item.key} title={`${item.label}: ${item.value} ${unit}`}>
          <span className="bar-label">
            <strong>{item.label}</strong>
            {item.sub && <small>{item.sub}</small>}
          </span>
          <span className="bar-track" aria-hidden="true">
            <span className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </span>
          <span className="bar-value">
            {item.value}
            <span className="sr-only"> {unit}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
