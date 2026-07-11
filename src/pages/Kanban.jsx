import React, { useState } from 'react'
import { useStore, STAGES, toast } from '../store.jsx'
import { Chip, Modal, Empty } from '../components/ui.jsx'
import { fmtPhone, timeAgo, money } from '../lib/format.js'
import { LOSS_REASONS } from '../data/demo.js'

function LeadCard({ lead, state, onDragStart, onOpen }) {
  const af = state.affiliates.find(a => a.id === lead.afiliadoId)
  const resp = state.team.find(t => t.id === lead.responsavelId)
  return (
    <div
      className="kcard"
      draggable
      onDragStart={e => onDragStart(e, lead.id)}
      onClick={() => onOpen(lead.id)}
      title="Arraste para mudar de etapa · clique para abrir a conversa"
    >
      <div className="name">
        {lead.respondeu && <span className="pulse-dot" title="Lead respondeu!" />}
        {lead.nome}
      </div>
      <div className="phone tnum">{fmtPhone(lead.telefone)}</div>
      <div className="meta">
        {af ? <Chip>⭐ {af.nome}</Chip> : <Chip kind="warn">Sem afiliado</Chip>}
        {lead.produtoInteresse && <Chip kind="gray">{lead.produtoInteresse}</Chip>}
      </div>
      <div className="foot">
        <span>⏱ {timeAgo(lead.etapaDesde)} na etapa</span>
        <span>{resp ? resp.nome.split(' ')[0] : '—'}</span>
      </div>
      {lead.etapa === 'ganho' && lead.valorVenda && (
        <div style={{ marginTop: 8, color: '#5FCBA5', fontWeight: 800, fontSize: 13 }} className="tnum">{money(lead.valorVenda)}</div>
      )}
      {lead.etapa === 'perdido' && lead.motivoPerda && (
        <div style={{ marginTop: 8, color: '#E08983', fontSize: 11.5 }}>Motivo: {lead.motivoPerda}</div>
      )}
    </div>
  )
}

export default function Kanban({ openConversation }) {
  const { state, dispatch } = useStore()
  const [dragId, setDragId] = useState(null)
  const [over, setOver] = useState(null)
  const [modal, setModal] = useState(null) // {leadId, etapa:'ganho'|'perdido'}
  const [valor, setValor] = useState('')
  const [motivo, setMotivo] = useState(LOSS_REASONS[0])
  const [filters, setFilters] = useState({ afiliado: '', resp: '', produto: '', periodo: 0 })

  const cutoff = filters.periodo ? Date.now() - filters.periodo * 86400000 : 0
  const leads = state.leads.filter(l =>
    (!filters.afiliado || l.afiliadoId === filters.afiliado) &&
    (!filters.resp || l.responsavelId === filters.resp) &&
    (!filters.produto || l.produtoInteresse === filters.produto) &&
    l.criadoEm >= cutoff
  )

  const doMove = (leadId, etapa) => {
    const lead = state.leads.find(l => l.id === leadId)
    if (!lead || lead.etapa === etapa) return
    if (etapa === 'ganho') { setValor(''); setModal({ leadId, etapa }); return }
    if (etapa === 'perdido') { setMotivo(LOSS_REASONS[0]); setModal({ leadId, etapa }); return }
    dispatch({ type: 'MOVE_LEAD', leadId, etapa })
    toast(dispatch, `${lead.nome} → ${STAGES.find(s => s.id === etapa)?.nome}`)
  }

  const confirmModal = () => {
    const lead = state.leads.find(l => l.id === modal.leadId)
    if (modal.etapa === 'ganho') {
      const v = parseFloat(String(valor).replace(/\./g, '').replace(',', '.'))
      if (!v || v <= 0) return
      dispatch({ type: 'MOVE_LEAD', leadId: modal.leadId, etapa: 'ganho', valorVenda: v })
      toast(dispatch, `🏆 Venda de ${money(v)} registrada para ${lead.nome}!`, 'win')
    } else {
      dispatch({ type: 'MOVE_LEAD', leadId: modal.leadId, etapa: 'perdido', motivoPerda: motivo })
      toast(dispatch, `${lead.nome} marcado como perdido (${motivo})`, 'lost')
    }
    setModal(null)
  }

  const onDrop = etapa => { if (dragId) doMove(dragId, etapa); setDragId(null); setOver(null) }

  const columns = [
    ...STAGES.map(s => ({ key: s.id, title: s.nome, cls: 'stage-col' })),
    { key: 'ganho', title: '🏆 Ganho', cls: 'win-col' },
    { key: 'perdido', title: 'Perdido', cls: 'lost-col' },
  ]

  return (
    <div>
      <h1 className="page-title">Funil / Kanban</h1>
      <p className="page-sub">Arraste os cards entre as etapas · leads do WhatsApp entram automaticamente em "Novo Lead"</p>

      <div className="filters">
        <select className="input" value={filters.afiliado} onChange={e => setFilters({ ...filters, afiliado: e.target.value })} aria-label="Filtrar por afiliado">
          <option value="">Todos os afiliados</option>
          {state.affiliates.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <select className="input" value={filters.resp} onChange={e => setFilters({ ...filters, resp: e.target.value })} aria-label="Filtrar por responsável">
          <option value="">Todo o comercial</option>
          {state.team.filter(t => t.papel === 'comercial').map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <select className="input" value={filters.produto} onChange={e => setFilters({ ...filters, produto: e.target.value })} aria-label="Filtrar por produto">
          <option value="">Todos os produtos</option>
          {state.products.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input" value={filters.periodo} onChange={e => setFilters({ ...filters, periodo: +e.target.value })} aria-label="Filtrar por período">
          <option value={0}>Todo o período</option>
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      <div className="kanban">
        {columns.map(col => {
          const items = leads
            .filter(l => l.etapa === col.key)
            .sort((a, b) => (b.respondeu - a.respondeu) || b.ultimaAtualizacao - a.ultimaAtualizacao)
          return (
            <div
              key={col.key}
              className={`kcol ${col.cls} ${over === col.key ? 'drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setOver(col.key) }}
              onDragLeave={() => setOver(null)}
              onDrop={() => onDrop(col.key)}
            >
              <div className="kcol-head">
                <h3>{typeof col.key === 'number' ? `${col.key}. ` : ''}{col.title}</h3>
                <span className="count">{items.length}</span>
              </div>
              {items.length === 0 && <Empty icon="◌" title="Vazio" sub="Arraste um card para cá" />}
              {items.map(l => (
                <LeadCard key={l.id} lead={l} state={state}
                  onDragStart={(e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move' }}
                  onOpen={openConversation}
                />
              ))}
            </div>
          )
        })}
      </div>

      {modal?.etapa === 'ganho' && (
        <Modal title="🏆 Registrar venda" sub="Informe o valor da venda — a comissão do afiliado será calculada automaticamente." onClose={() => setModal(null)}>
          <label className="fld" htmlFor="valor-venda">Valor da venda (R$)</label>
          <input id="valor-venda" className="input" autoFocus placeholder="Ex.: 2890,00" value={valor}
            onChange={e => setValor(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmModal()} />
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={confirmModal}>Confirmar Ganho</button>
          </div>
        </Modal>
      )}
      {modal?.etapa === 'perdido' && (
        <Modal title="Marcar como perdido" sub="Selecione o motivo da perda para alimentar as métricas." onClose={() => setModal(null)}>
          <label className="fld" htmlFor="motivo-perda">Motivo da perda</label>
          <select id="motivo-perda" className="input" value={motivo} onChange={e => setMotivo(e.target.value)}>
            {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={confirmModal}>Confirmar Perda</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
