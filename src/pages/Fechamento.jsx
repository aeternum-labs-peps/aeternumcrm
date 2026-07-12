import React, { useState, useMemo } from 'react'
import { useStore, toast, salesOf } from '../store.jsx'
import { Chip, Empty } from '../components/ui.jsx'
import { money, n, monthKey, monthLabel, fmtDate } from '../lib/format.js'

function monthOptions(state) {
  const keys = new Set(salesOf(state).map(s => monthKey(s.data)))
  keys.add(monthKey(Date.now()))
  return [...keys].sort().reverse()
}

/**
 * Fechamento mensal de comissões.
 * - Admin: consolidado de todos os afiliados + botão "Fechar mês" + CSV.
 * - Afiliado (isPortal): extrato apenas do próprio, com detalhamento por venda.
 */
export default function Fechamento({ isPortal, afiliadoId }) {
  const { state, dispatch } = useStore()
  const months = monthOptions(state)
  const [month, setMonth] = useState(months[0])

  const closing = state.closings[month]
  const monthSales = salesOf(state).filter(s => monthKey(s.data) === month &&
    (!isPortal || s.afiliadoId === afiliadoId))

  const byAffiliate = useMemo(() => {
    const map = {}
    monthSales.forEach(s => {
      const k = s.afiliadoId || 'sem'
      map[k] = map[k] || { vendas: 0, receita: 0, comissao: 0 }
      map[k].vendas++
      map[k].receita += s.valor
      map[k].comissao += s.comissaoCalculada
    })
    return map
  }, [monthSales])

  const totals = Object.values(byAffiliate).reduce(
    (a, b) => ({ vendas: a.vendas + b.vendas, receita: a.receita + b.receita, comissao: a.comissao + b.comissao }),
    { vendas: 0, receita: 0, comissao: 0 })

  const exportCSV = () => {
    const rows = [['Afiliado', 'Vendas', 'Receita', 'Comissao', 'Status']]
    state.affiliates.forEach(a => {
      const d = byAffiliate[a.id]
      if (!d) return
      rows.push([a.nome, d.vendas, d.receita.toFixed(2), d.comissao.toFixed(2), closing?.status || 'aberto'])
    })
    const csv = rows.map(r => r.join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const el = document.createElement('a')
    el.href = url; el.download = `fechamento-${month}.csv`; el.click()
    URL.revokeObjectURL(url)
    toast(dispatch, 'CSV exportado ✓')
  }

  const closeMonth = () => {
    dispatch({ type: 'CLOSE_MONTH', monthKey: month })
    toast(dispatch, `Mês ${monthLabel(month)} fechado — comissões marcadas como pagas 💰`, 'win')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">{isPortal ? 'Minhas Comissões' : 'Fechamento de Comissões'}</h1>
          <p className="page-sub">{isPortal ? 'Extrato mensal das vendas que geraram comissão' : 'Consolidado mensal por afiliado'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input" value={month} onChange={e => setMonth(e.target.value)} aria-label="Mês">
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          {!isPortal && <button className="btn btn-ghost" onClick={exportCSV}>Exportar CSV</button>}
          {!isPortal && (
            closing?.status === 'pago'
              ? <Chip kind="win">✓ Mês fechado em {fmtDate(closing.fechadoEm)}</Chip>
              : <button className="btn btn-primary" onClick={closeMonth} disabled={!totals.vendas}>Fechar mês</button>
          )}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi"><div className="label">Vendas no mês</div><div className="value">{n(totals.vendas)}</div></div>
        <div className="card kpi"><div className="label">Receita</div><div className="value">{money(totals.receita)}</div></div>
        <div className="card kpi"><div className="label">{isPortal ? 'Minha comissão' : 'Comissões devidas'}</div><div className="value metal">{money(totals.comissao)}</div></div>
        <div className="card kpi">
          <div className="label">Status</div>
          <div className="value" style={{ fontSize: 19, color: closing?.status === 'pago' ? '#5FCBA5' : 'var(--warn)' }}>
            {closing?.status === 'pago' ? '✓ Pago' : '● Aberto'}
          </div>
        </div>
      </div>

      {!isPortal ? (
        <div className="card tbl-wrap">
          <h2 className="section-title">Por afiliado — {monthLabel(month)}</h2>
          {!totals.vendas ? <Empty icon="◌" title="Sem vendas neste mês" /> : (
            <table className="tbl">
              <thead><tr><th>Afiliado</th><th className="num">Vendas</th><th className="num">Receita</th><th className="num">%</th><th className="num">Comissão devida</th><th>Status</th></tr></thead>
              <tbody>
                {state.affiliates.map(a => {
                  const d = byAffiliate[a.id]
                  if (!d) return null
                  return (
                    <tr key={a.id}>
                      <td><b>{a.nome}</b></td>
                      <td className="num">{d.vendas}</td>
                      <td className="num">{money(d.receita)}</td>
                      <td className="num">{a.percentualComissao}%</td>
                      <td className="num" style={{ color: 'var(--rose-gold-light)', fontWeight: 800 }}>{money(d.comissao)}</td>
                      <td><Chip kind={closing?.status === 'pago' ? 'win' : 'warn'}>{closing?.status === 'pago' ? 'pago' : 'aberto'}</Chip></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card tbl-wrap">
          <h2 className="section-title">Detalhamento — {monthLabel(month)}</h2>
          {!monthSales.length ? <Empty icon="◌" title="Sem comissões neste mês" sub="Suas vendas ganhas aparecem aqui" /> : (
            <table className="tbl">
              <thead><tr><th>Data</th><th>Produto</th><th className="num">Valor da venda</th><th className="num">Sua comissão</th><th>Status</th></tr></thead>
              <tbody>
                {monthSales.sort((a, b) => b.data - a.data).map(s => (
                  <tr key={s.id}>
                    <td>{fmtDate(s.data)}</td>
                    <td>{s.produto}</td>
                    <td className="num">{money(s.valor)}</td>
                    <td className="num" style={{ color: 'var(--rose-gold-light)', fontWeight: 800 }}>{money(s.comissaoCalculada)}</td>
                    <td><Chip kind={closing?.status === 'pago' ? 'win' : 'warn'}>{closing?.status === 'pago' ? 'pago' : 'aberto'}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <hr className="divider-gold" />
      <div className="card">
        <h2 className="section-title">Histórico de Fechamentos</h2>
        {Object.keys(state.closings).length === 0 ? <Empty icon="◌" title="Nenhum fechamento anterior" /> : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(state.closings).sort((a, b) => b[0].localeCompare(a[0])).map(([k, c]) => (
              <button key={k} className="btn btn-ghost" onClick={() => setMonth(k)}>
                {monthLabel(k)} — <span style={{ color: '#5FCBA5' }}>✓ {c.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
