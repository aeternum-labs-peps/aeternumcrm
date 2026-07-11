import React, { useEffect } from 'react'
import { useStore } from '../store.jsx'

export function KPI({ label, value, hint, metal }) {
  return (
    <div className="card kpi">
      <div className="label">{label}</div>
      <div className={`value ${metal ? 'metal' : ''}`}>{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

export function Chip({ children, kind = '' }) {
  return <span className={`chip ${kind}`}>{children}</span>
}

export function Avatar({ name, sm }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div className={`avatar ${sm ? 'sm' : ''}`}>{initials}</div>
}

export function Modal({ title, sub, onClose, children }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="modal-back" onMouseDown={e => e.target === e.currentTarget && onClose?.()}>
      <div className="card modal" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {sub && <p className="msub">{sub}</p>}
        {children}
      </div>
    </div>
  )
}

export function Toasts() {
  const { state, dispatch } = useStore()
  useEffect(() => {
    if (!state.toasts.length) return
    const t = setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id: state.toasts[0].id }), 3600)
    return () => clearTimeout(t)
  }, [state.toasts, dispatch])
  return (
    <div className="toasts" aria-live="polite">
      {state.toasts.map(t => <div key={t.id} className={`toast ${t.kind}`}>{t.texto}</div>)}
    </div>
  )
}

export function Empty({ icon = '◌', title, sub }) {
  return (
    <div className="empty">
      <div className="eico">{icon}</div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5 }}>{sub}</div>}
    </div>
  )
}

export function StageChip({ etapa, stages }) {
  if (etapa === 'ganho') return <Chip kind="win">GANHO</Chip>
  if (etapa === 'perdido') return <Chip kind="lost">PERDIDO</Chip>
  const s = stages.find(x => x.id === etapa)
  return <Chip kind="gray">{etapa}. {s ? s.nome : etapa}</Chip>
}

// Funil horizontal com barras metálicas
export function FunnelBars({ counts, stages }) {
  const rows = [
    ...stages.map(s => ({ nome: `${s.id}. ${s.nome}`, v: counts[s.id] || 0, cls: '' })),
    { nome: 'Ganho', v: counts.ganho || 0, cls: 'win' },
    { nome: 'Perdido', v: counts.perdido || 0, cls: 'lost' },
  ]
  const max = Math.max(1, ...rows.map(r => r.v))
  return (
    <div>
      {rows.map(r => (
        <div className="funnel-row" key={r.nome}>
          <div className="fname">{r.nome}</div>
          <div className="fbar-wrap">
            <div className={`fbar ${r.cls}`} style={{ width: `${(r.v / max) * 100}%` }} />
          </div>
          <div className="fcount">{r.v}</div>
        </div>
      ))}
    </div>
  )
}
