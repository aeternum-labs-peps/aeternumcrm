import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useStore, STAGES, toast } from '../store.jsx'
import { Chip, Avatar, Empty, StageChip } from '../components/ui.jsx'
import { fmtPhone, fmtTime, fmtDate, timeAgo } from '../lib/format.js'
import { zapiSendText } from '../lib/zapi.js'

export default function Conversas({ selectedLeadId, setSelectedLeadId }) {
  const { state, dispatch } = useStore()
  const [search, setSearch] = useState('')
  const [afFilter, setAfFilter] = useState('')
  const [draft, setDraft] = useState('')
  const [notes, setNotes] = useState({})
  const msgsRef = useRef(null)

  const conversations = useMemo(() => {
    const q = search.toLowerCase()
    return state.leads
      .filter(l => {
        const af = state.affiliates.find(a => a.id === l.afiliadoId)
        return (!afFilter || l.afiliadoId === afFilter) &&
          (!q || l.nome.toLowerCase().includes(q) || l.telefone.includes(q) || af?.nome.toLowerCase().includes(q))
      })
      .sort((a, b) => (b.respondeu - a.respondeu) || b.ultimaAtualizacao - a.ultimaAtualizacao)
  }, [state, search, afFilter])

  const lead = state.leads.find(l => l.id === selectedLeadId) || conversations[0]
  const leadDigits = lead ? lead.telefone.replace(/\D/g, '') : ''
  const msgs = state.messages.filter(m => lead && String(m.phone || '').replace(/\D/g, '') === leadDigits).sort((a, b) => a.timestamp - b.timestamp)
  const af = lead && state.affiliates.find(a => a.id === lead.afiliadoId)

  useEffect(() => {
    if (lead?.respondeu) dispatch({ type: 'MARK_READ', leadId: lead.id })
  }, [lead?.id]) // eslint-disable-line

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight })
  }, [lead?.id, msgs.length])

  const send = async () => {
    if (!draft.trim() || !lead) return
    const texto = draft.trim()
    dispatch({ type: 'SEND_MESSAGE', leadId: lead.id, texto })
    setDraft('')
    // Envio REAL pelo WhatsApp via Z-API — sempre tenta; avisa se falhar
    try {
      await zapiSendText(lead.telefone.replace(/\D/g, ''), texto)
      toast(dispatch, 'Enviado pelo WhatsApp ✓')
    } catch (e) {
      toast(dispatch, 'Falha ao enviar pelo WhatsApp: ' + e.message, 'lost')
    }
  }

  const moveStage = etapa => {
    if (etapa === 'ganho' || etapa === 'perdido') {
      toast(dispatch, 'Use o Kanban para registrar Ganho/Perdido (valor e motivo).', 'warn')
      return
    }
    dispatch({ type: 'MOVE_LEAD', leadId: lead.id, etapa: +etapa })
    toast(dispatch, `${lead.nome} → ${STAGES.find(s => s.id === +etapa)?.nome}`)
  }

  return (
    <div>
      <h1 className="page-title">Conversas</h1>
      <p className="page-sub">Acompanhamento em tempo real — histórico importado do WhatsApp incluído</p>

      <div className="chat-layout">
        {/* INBOX */}
        <div className="card inbox">
          <input className="input" placeholder="🔍 Buscar lead..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
          <select className="input" value={afFilter} onChange={e => setAfFilter(e.target.value)}
            style={{ marginBottom: 10 }} aria-label="Filtrar por afiliado">
            <option value="">Todos os afiliados</option>
            {state.affiliates.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
          {conversations.length === 0 && <Empty icon="💬" title="Nenhuma conversa" sub="Ajuste a busca ou os filtros" />}
          {conversations.map(l => {
            const ld = l.telefone.replace(/\D/g, '')
            const last = state.messages.filter(m => String(m.phone || '').replace(/\D/g, '') === ld).slice(-1)[0]
            const lAf = state.affiliates.find(a => a.id === l.afiliadoId)
            return (
              <div key={l.id} className={`inbox-item ${lead?.id === l.id ? 'active' : ''}`}
                onClick={() => setSelectedLeadId(l.id)} role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelectedLeadId(l.id)}>
                <Avatar name={l.nome} />
                <div className="ii-body">
                  <div className="ii-name">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {l.respondeu && <span className="pulse-dot" />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nome}</span>
                    </span>
                    <time>{last ? timeAgo(last.timestamp) : ''}</time>
                  </div>
                  <div className="ii-prev">{last?.texto || '—'}</div>
                  {lAf && <div style={{ marginTop: 4 }}><Chip>⭐ {lAf.nome}</Chip></div>}
                </div>
              </div>
            )
          })}
        </div>

        {/* CHAT */}
        <div className="card chat-pane">
          {!lead ? <Empty icon="💬" title="Selecione uma conversa" /> : (
            <>
              <div className="chat-head">
                <Avatar name={lead.nome} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{lead.nome}</b>
                  <div style={{ color: 'var(--text-300)', fontSize: 11.5 }} className="tnum">{fmtPhone(lead.telefone)}</div>
                </div>
                <select className="input" style={{ width: 175 }} value={typeof lead.etapa === 'number' ? lead.etapa : ''}
                  onChange={e => moveStage(e.target.value)} aria-label="Mover de etapa"
                  disabled={lead.etapa === 'ganho' || lead.etapa === 'perdido'}>
                  {typeof lead.etapa !== 'number' && <option value="">{lead.etapa === 'ganho' ? '🏆 Ganho' : 'Perdido'}</option>}
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.id}. {s.nome}</option>)}
                </select>
              </div>
              <div className="chat-msgs" ref={msgsRef}>
                {msgs.map((m, i) => {
                  const showDate = i === 0 || fmtDate(m.timestamp) !== fmtDate(msgs[i - 1].timestamp)
                  return (
                    <React.Fragment key={m.id}>
                      {showDate && <div style={{ textAlign: 'center', color: 'var(--text-300)', fontSize: 10.5, margin: '6px 0' }}>{fmtDate(m.timestamp)}</div>}
                      <div className={`bubble ${m.direcao === 'recebida' ? 'in' : 'out'}`}>
                        {m.texto}
                        <time>{fmtTime(m.timestamp)}</time>
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>
              <div className="chat-input">
                <input className="input" placeholder="Responder pelo WhatsApp..." value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()} />
                <button className="btn btn-primary" onClick={send} disabled={!draft.trim()}>Enviar ➤</button>
              </div>
            </>
          )}
        </div>

        {/* PAINEL LATERAL */}
        <div className="card lead-panel">
          {lead && (
            <>
              <h2 className="section-title">Dados do Lead</h2>
              <dl>
                <dt>Etapa</dt><dd><StageChip etapa={lead.etapa} stages={STAGES} /></dd>
                <dt>Afiliado</dt><dd>{af ? <Chip>⭐ {af.nome}</Chip> : <Chip kind="warn">Origem indefinida</Chip>}</dd>
                <dt>Produto de interesse</dt><dd>{lead.produtoInteresse || '—'}</dd>
                <dt>Responsável</dt>
                <dd>
                  <select className="input" value={lead.responsavelId || ''}
                    onChange={e => dispatch({ type: 'ASSIGN_LEAD', leadId: lead.id, responsavelId: e.target.value || null })}
                    aria-label="Responsável comercial">
                    <option value="">Não atribuído</option>
                    {state.team.filter(t => t.papel === 'comercial').map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </dd>
                <dt>Entrou em</dt><dd>{fmtDate(lead.criadoEm)}</dd>
                <dt>Mensagem de origem</dt>
                <dd style={{ color: 'var(--text-300)', fontStyle: 'italic', fontSize: 12 }}>"{lead.origemMensagem}"</dd>
                <dt>Notas internas</dt>
                <dd>
                  <textarea className="input" rows={4} placeholder="Anotações do comercial (não vai para o WhatsApp)..."
                    value={notes[lead.id] || ''}
                    onChange={e => setNotes({ ...notes, [lead.id]: e.target.value })} />
                </dd>
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
