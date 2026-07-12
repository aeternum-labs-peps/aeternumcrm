import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts'
import { useStore, STAGES, funnelCounts, affiliateMetrics, salesOf } from '../store.jsx'
import { KPI, FunnelBars, Chip } from '../components/ui.jsx'
import { money, n, pct } from '../lib/format.js'

const PERIODS = [
  { id: 7, label: '7 dias' },
  { id: 30, label: '30 dias' },
  { id: 90, label: '90 dias' },
  { id: 0, label: 'Tudo' },
]

const tooltipStyle = {
  background: '#1E2E4D', border: '1px solid rgba(198,153,122,0.4)',
  borderRadius: 10, color: '#F3EEE7', fontSize: 12,
}

export default function Dashboard({ setRoute, openAffiliate }) {
  const { state } = useStore()
  const [period, setPeriod] = useState(30)

  const cutoff = period ? Date.now() - period * 86400000 : 0
  const leads = state.leads.filter(l => l.criadoEm >= cutoff)
  const sales = salesOf(state).filter(s => s.data >= cutoff)

  const counts = funnelCounts(leads)
  const receita = sales.reduce((s, v) => s + v.valor, 0)
  const comissoes = sales.reduce((s, v) => s + v.comissaoCalculada, 0)
  const conversao = leads.length ? (counts.ganho / leads.length) * 100 : 0

  const ranking = useMemo(() =>
    state.affiliates
      .map(a => ({ a, m: affiliateMetrics({ ...state, leads, sales }, a.id) }))
      .sort((x, y) => y.m.vendasValor - x.m.vendasValor),
    [state, leads, sales])

  // Evolução: leads e vendas por dia
  const evolution = useMemo(() => {
    const days = period || 90
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i)
      const d1 = d0.getTime() + 86400000
      out.push({
        dia: d0.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: state.leads.filter(l => l.criadoEm >= d0.getTime() && l.criadoEm < d1).length,
        vendas: salesOf(state).filter(s => s.data >= d0.getTime() && s.data < d1).length,
      })
    }
    return out
  }, [state, period])

  const teamPerf = state.team.filter(t => t.papel === 'comercial').map(t => {
    const tl = leads.filter(l => l.responsavelId === t.id)
    const ts = sales.filter(s => {
      const lead = state.leads.find(l => l.id === s.leadId)
      return lead?.responsavelId === t.id
    })
    return { nome: t.nome.split(' ')[0], leads: tl.length, ganhos: tl.filter(l => l.etapa === 'ganho').length, receita: ts.reduce((a, b) => a + b.valor, 0) }
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Dashboard Geral</h1>
          <p className="page-sub">Visão consolidada da operação de afiliados</p>
        </div>
        <select className="input" style={{ width: 130 }} value={period} onChange={e => setPeriod(+e.target.value)} aria-label="Período">
          {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      <div className="kpi-grid">
        <KPI label="Total de Leads" value={n(leads.length)} hint={`${counts[1]} novos aguardando contato`} />
        <KPI label="Taxa de Conversão" value={pct(conversao)} hint={`${counts.ganho} ganhos · ${counts.perdido} perdidos`} />
        <KPI label="Receita Total" value={money(receita)} metal hint={`${sales.length} vendas no período`} />
        <KPI label="Comissões a Pagar" value={money(comissoes)} hint="Padrão 15% por afiliado" />
      </div>

      <div className="grid-31" style={{ marginBottom: 16 }}>
        <div className="card">
          <h2 className="section-title">Funil Consolidado</h2>
          <FunnelBars counts={counts} stages={STAGES} />
        </div>
        <div className="card">
          <h2 className="section-title">Ranking de Afiliados</h2>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th></th><th>Afiliado</th><th className="num">Leads</th><th className="num">Vendas</th><th className="num">Receita</th></tr></thead>
              <tbody>
                {ranking.map(({ a, m }, i) => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => openAffiliate(a.id)}>
                    <td><span className="rank-medal">{medals[i] || `${i + 1}º`}</span></td>
                    <td><b>{a.nome}</b><br /><span style={{ color: 'var(--text-300)', fontSize: 11 }}>{pct(m.conversao)} conv.</span></td>
                    <td className="num">{m.leads}</td>
                    <td className="num">{m.vendasQtd}</td>
                    <td className="num" style={{ color: 'var(--rose-gold-light)', fontWeight: 700 }}>{money(m.vendasValor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="section-title">Evolução — Leads × Vendas</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evolution}>
              <CartesianGrid stroke="rgba(195,200,208,0.08)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: '#A9B2C0', fontSize: 10 }} interval="preserveStartEnd" minTickGap={30} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A9B2C0', fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="leads" name="Leads" stroke="#C6997A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="vendas" name="Vendas" stroke="#2E9E7B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="section-title">Desempenho do Comercial</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teamPerf}>
              <CartesianGrid stroke="rgba(195,200,208,0.08)" vertical={false} />
              <XAxis dataKey="nome" tick={{ fill: '#A9B2C0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A9B2C0', fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => name === 'receita' ? money(v) : v} />
              <Bar dataKey="leads" name="Leads" radius={[6, 6, 0, 0]}>
                {teamPerf.map((_, i) => <Cell key={i} fill="#C6997A" />)}
              </Bar>
              <Bar dataKey="ganhos" name="Ganhos" radius={[6, 6, 0, 0]}>
                {teamPerf.map((_, i) => <Cell key={i} fill="#2E9E7B" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {teamPerf.map(t => <Chip key={t.nome} kind="gray">{t.nome}: {money(t.receita)}</Chip>)}
          </div>
        </div>
      </div>
    </div>
  )
}
