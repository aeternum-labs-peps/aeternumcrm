const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const num = new Intl.NumberFormat('pt-BR')

export const money = v => brl.format(v || 0)
export const n = v => num.format(v || 0)
export const pct = v => `${(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

export function maskPhone(phone) {
  // (11) 9****-**34 — afiliado não vê o contato do lead
  const d = phone.replace(/\D/g, '')
  return `(${d.slice(2, 4)}) ${d.slice(4, 5)}****-**${d.slice(-2)}`
}

export function fmtPhone(phone) {
  const d = phone.replace(/\D/g, '')
  return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  return `${Math.floor(d / 30)} mês${Math.floor(d / 30) > 1 ? 'es' : ''}`
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('pt-BR')
}

export function fmtDateTime(ts) {
  return new Date(ts).toLocaleDateString('pt-BR') + ' ' +
    new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function monthKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function monthLabel(key) {
  const [y, m] = key.split('-')
  return `${MONTH_NAMES[parseInt(m) - 1]} / ${y}`
}
