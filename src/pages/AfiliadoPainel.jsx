import React, { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { useStore, STAGES, affiliateMetrics, leadsOf, salesOf } from '../store.jsx'
import { KPI, FunnelBars, Chip, StageChip, Empty } from '../components/ui.jsx'
import { money, n, pct, maskPhone, fmtPhone, fmtDate, monthKey, MONTH_NAMES } from '../lib/format.js'

/**
 * Painel individual do afiliado.
 * - Admin: visão completa (telefones visíveis) + botão voltar.
 * - Portal do afiliado: mesma visão, mas telefones mascarados e sem
 *   dados de outros afiliados (RLS no Supabase em produção).
 */
export default function AfiliadoPainel({ afiliadoId, isPortal, onBack }) {
  const { state } = useStore()
  const af = state.affiliates.find(a => a.id === afiliadoId)
  const m = affiliateMetrics(state, afiliadoId)
  const leads = leadsOf(state, afiliadoId).sort((a, b) => b.ultimaAtualizacao - a.ultimaAtualizacao)

  const monthly = useMemo(() => {
    const out = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const key = monthKey(d.getTime())
      const sales = salesOf(state, afiliadoId).filter(s => monthKey(s.data) === key)
      out.push({
        mes: MONTH_NAMES[d.getMonth()].slice(0, 3),
        vendas: sales.reduce((a, b) => a + b.valor, 0),
        comissao: sales.reduce((a, b) => a + b.comissaoCalculada, 0),
      })
    }
    return out
  }, [state, afiliadoId])

  if (!af) return <Empty icon="⭐" title="Afiliado não encontrado" />

  return (
    <div>
      {!isPortal && <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 14 }}>← Voltar</button>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{isPortal ? `Olá, ${af.nome}!` : af.nome}</h1>
        <Chip>⭐ {af.tagSlug}</Chip>
        <Chip kind={af.status === 'ativo' ? 'win' : 'lost'}>{af.status}</Chip>
      </div>
      <p className="page-sub">{af.instagram} · comissão de {af.percentualComissao}% sobre vendas ganhas</p>

      <div className="kpi-grid">
        <KPI label="Leads Gerados" value={n(m.leads)} hint="Chegaram pela sua divulgação" />
        <KPI label="Vendas Fechadas" value={n(m.vendasQtd)} hint={`Conversão de ${pct(m.conversao)}`} />
        <KPI label="Valor Vendido" value={money(m.vendasValor)} />
        <KPI label={`Sua Comissão (${af.percentualComissao}%)`} value={money(m.comissao)} metal hint="Acumulado no período" />
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <h2 className="section-title">Meu Funil</h2>
          <FunnelBars counts={m.funil} stages={STAGES} />
        </div>
        <div className="card">
          <h2 className="section-title">Evolução Mensal</h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthly}>
              <CartesianGrid stroke="rgba(195,200,208,0.08)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#A9B2C0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#A9B2C0', fontSize: 10 }} axisLine={false} tickLine={false} width={54}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1E2E4D', border: '1px solid rgba(198,153,122,0.4)', borderRadius: 10, color: '#F3EEE7', fontSize: 12 }}
                formatter={v => money(v)} />
              <Bar dataKey="vendas" name="Vendas" radius={[6, 6, 0, 0]}>
                {monthly.map((_, i) => <Cell key={i} fill="#C6997A" />)}
              </Bar>
              <Bar dataKey="comissao" name="Comissão" radius={[6, 6, 0, 0]}>
                {monthly.map((_, i) => <Cell key={i} fill="#D4AF37" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card tbl-wrap">
        <h2 className="section-title">{isPortal ? 'Meus Leads' : 'Leads deste afiliado'}</h2>
        {leads.length === 0 ? <Empty icon="◌" title="Nenhum lead ainda" sub="Divulgue seu link e os leads aparecem aqui automaticamente" /> : (
          <table className="tbl">
            <thead>
              <tr><th>Lead</th><th>WhatsApp</th><th>Produto</th><th>Etapa</th><th className="num">Entrou em</th><th className="num">Venda</th></tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td><b>{isPortal ? l.nome.split(' ')[0] + ' ' + (l.nome.split(' ')[1]?.[0] || '') + '.' : l.nome}</b></td>
                  <td className="tnum" style={{ color: 'var(--text-300)' }}>{isPortal ? maskPhone(l.telefone) : fmtPhone(l.telefone)}</td>
                  <td>{l.produtoInteresse || '—'}</td>
                  <td><StageChip etapa={l.etapa} stages={STAGES} /></td>
                  <td className="num">{fmtDate(l.criadoEm)}</td>
                  <td className="num" style={{ color: l.valorVenda ? '#5FCBA5' : 'var(--text-300)', fontWeight: 700 }}>
                    {l.valorVenda ? money(l.valorVenda) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
