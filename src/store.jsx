import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { buildDemoState } from './data/demo.js'
import { parseIntroMessage, slugify, norm } from './lib/parser.js'

// ============================================================
// STORE (modo DEMO — em produção, substituir por Supabase:
// cada action vira um insert/update com RLS por papel/afiliado,
// e o recebimento de mensagens chega via webhook n8n/Evolution)
// ============================================================

// v2: CRM zerado para produção (11/07/2026) — trocar a versão força
// todos os navegadores a recomeçarem com o estado limpo
const STORAGE_KEY = 'aeternum-crm-v2'

const StoreCtx = createContext(null)

export const STAGES = [
  { id: 1, nome: 'Novo Lead' },
  { id: 2, nome: 'Contato Iniciado' },
  { id: 3, nome: 'Qualificado' },
  { id: 4, nome: 'Proposta Enviada' },
  { id: 5, nome: 'Negociação' },
  { id: 6, nome: 'Fechamento' },
]

let idSeq = 1000
const nextId = p => `${p}-${++idSeq}-${Math.random().toString(36).slice(2, 6)}`

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.user }
    case 'LOGOUT':
      return { ...state, user: null }

    case 'MOVE_LEAD': {
      const { leadId, etapa, valorVenda, motivoPerda } = action
      const leads = state.leads.map(l => {
        if (l.id !== leadId) return l
        return {
          ...l,
          etapa,
          etapaDesde: Date.now(),
          ultimaAtualizacao: Date.now(),
          valorVenda: etapa === 'ganho' ? valorVenda : l.valorVenda,
          motivoPerda: etapa === 'perdido' ? motivoPerda : null,
          respondeu: false,
        }
      })
      let sales = state.sales
      const lead = state.leads.find(l => l.id === leadId)
      if (etapa === 'ganho' && valorVenda && lead) {
        const af = state.affiliates.find(a => a.id === lead.afiliadoId)
        const pctCom = af ? af.percentualComissao : 15
        sales = [
          ...sales.filter(s => s.leadId !== leadId),
          {
            id: nextId('vd'), leadId, afiliadoId: lead.afiliadoId,
            valor: valorVenda, produto: lead.produtoInteresse,
            data: Date.now(), comissaoCalculada: +(valorVenda * pctCom / 100).toFixed(2),
          },
        ]
      }
      if (etapa !== 'ganho') sales = sales.filter(s => s.leadId !== leadId)
      return { ...state, leads, sales }
    }

    case 'ASSIGN_LEAD':
      return {
        ...state,
        leads: state.leads.map(l => l.id === action.leadId ? { ...l, responsavelId: action.responsavelId, ultimaAtualizacao: Date.now() } : l),
      }

    case 'SEND_MESSAGE': {
      // Em produção: POST para a Evolution API enviar pelo WhatsApp
      const msg = {
        id: nextId('msg'), leadId: action.leadId, direcao: 'enviada',
        texto: action.texto, timestamp: Date.now(), remetente: state.user?.nome || 'ÆTERNUM',
      }
      return {
        ...state,
        messages: [...state.messages, msg],
        leads: state.leads.map(l => l.id === action.leadId ? { ...l, ultimaAtualizacao: Date.now(), respondeu: false } : l),
      }
    }

    case 'MARK_READ':
      return { ...state, leads: state.leads.map(l => l.id === action.leadId ? { ...l, respondeu: false } : l) }

    case 'RECEIVE_WHATSAPP': {
      // ⭐ AUTO-ETIQUETAGEM (Seção 5) — ponto de entrada de toda mensagem.
      // Em produção este bloco roda no webhook (n8n) antes do insert no Supabase.
      const { texto, telefone, nome } = action
      const parsed = parseIntroMessage(texto, state.products)

      let affiliates = state.affiliates
      let afiliadoId = null
      let novoAfiliado = null
      if (parsed) {
        const found = affiliates.find(a => norm(a.nome) === norm(parsed.afiliadoNome))
        if (found) {
          afiliadoId = found.id
        } else {
          // Provisionamento automático do afiliado (Seção 5.2)
          novoAfiliado = {
            id: nextId('af'), nome: parsed.afiliadoNome, instagram: `@${slugify(parsed.afiliadoNome).replace(/-/g, '.')}`,
            foto: null, status: 'ativo', percentualComissao: 15,
            tagSlug: slugify(parsed.afiliadoNome), criadoEm: Date.now(),
          }
          affiliates = [...affiliates, novoAfiliado]
          afiliadoId = novoAfiliado.id
        }
      }

      // Deduplicação por telefone
      const existing = state.leads.find(l => l.telefone.replace(/\D/g, '') === telefone.replace(/\D/g, ''))
      let leads = state.leads
      let leadId
      if (existing) {
        leadId = existing.id
        leads = leads.map(l => l.id === leadId ? { ...l, respondeu: true, ultimaAtualizacao: Date.now() } : l)
      } else {
        leadId = nextId('ld')
        leads = [...leads, {
          id: leadId, nome: nome || `Lead ${telefone.slice(-4)}`, telefone,
          afiliadoId, produtoInteresse: parsed?.produto || null,
          etapa: 1, responsavelId: null, valorVenda: null, motivoPerda: null,
          criadoEm: Date.now(), etapaDesde: Date.now(), ultimaAtualizacao: Date.now(),
          respondeu: true, origemMensagem: texto,
        }]
      }
      const msg = {
        id: nextId('msg'), leadId, direcao: 'recebida', texto,
        timestamp: Date.now(), remetente: nome || telefone,
      }
      return {
        ...state, affiliates, leads,
        messages: [...state.messages, msg],
        lastAuto: { leadId, afiliadoId, parsed, novoAfiliado: !!novoAfiliado, existing: !!existing },
      }
    }

    case 'IMPORT_CHAT': {
      // Importa uma conversa REAL do WhatsApp (backfill ou polling).
      // Dedup: lead por telefone, mensagem por id do Z-API.
      const { phone, nome, msgs } = action // msgs já normalizadas (normalizeMsg)
      const digits = String(phone).replace(/\D/g, '')
      const existingIds = new Set(state.messages.map(m => m.id))
      const fresh = msgs
        .filter(m => !existingIds.has(m.id))
        .sort((a, b) => a.timestamp - b.timestamp)

      let lead = state.leads.find(l => l.telefone.replace(/\D/g, '') === digits)
      if (!fresh.length && lead) return state

      let affiliates = state.affiliates
      let leads = state.leads
      const lastTs = fresh.length ? fresh[fresh.length - 1].timestamp : Date.now()
      const hasNewIncoming = fresh.some(m => m.direcao === 'recebida')

      if (!lead) {
        // Etiquetagem retroativa: procura o padrão na 1ª mensagem recebida
        const firstIn = fresh.find(m => m.direcao === 'recebida')
        const parsed = firstIn ? parseIntroMessage(firstIn.texto, state.products) : null
        let afiliadoId = null
        if (parsed) {
          const found = affiliates.find(a => norm(a.nome) === norm(parsed.afiliadoNome))
          if (found) afiliadoId = found.id
          else {
            const novo = {
              id: nextId('af'), nome: parsed.afiliadoNome,
              instagram: `@${slugify(parsed.afiliadoNome).replace(/-/g, '.')}`,
              foto: null, status: 'ativo', percentualComissao: 15,
              tagSlug: slugify(parsed.afiliadoNome), criadoEm: Date.now(),
            }
            affiliates = [...affiliates, novo]
            afiliadoId = novo.id
          }
        }
        lead = {
          id: nextId('ld'), nome: nome || `Lead ${digits.slice(-4)}`, telefone: digits,
          afiliadoId, produtoInteresse: parsed?.produto || null,
          etapa: 1, responsavelId: null, valorVenda: null, motivoPerda: null,
          criadoEm: fresh[0]?.timestamp || Date.now(), etapaDesde: Date.now(),
          ultimaAtualizacao: lastTs, respondeu: hasNewIncoming,
          origemMensagem: firstIn?.texto || '',
        }
        leads = [...leads, lead]
      } else {
        leads = leads.map(l => l.id === lead.id
          ? { ...l, ultimaAtualizacao: Math.max(l.ultimaAtualizacao, lastTs), respondeu: l.respondeu || hasNewIncoming, nome: l.nome.startsWith('Lead ') && nome ? nome : l.nome }
          : l)
      }

      return {
        ...state, affiliates, leads,
        messages: [...state.messages, ...fresh.map(m => ({ ...m, leadId: lead.id }))],
      }
    }

    case 'CLEAR_DEMO_LEADS': {
      // Remove os leads fictícios (ids ld-N do seed) mantendo os reais
      const isDemo = id => /^ld-\d+$/.test(id)
      const leads = state.leads.filter(l => !isDemo(l.id))
      const keep = new Set(leads.map(l => l.id))
      return {
        ...state, leads,
        messages: state.messages.filter(m => keep.has(m.leadId)),
        sales: state.sales.filter(s => keep.has(s.leadId)),
      }
    }

    case 'SAVE_AFFILIATE': {
      const a = action.affiliate
      if (a.id) {
        return { ...state, affiliates: state.affiliates.map(x => x.id === a.id ? { ...x, ...a } : x) }
      }
      return {
        ...state,
        affiliates: [...state.affiliates, {
          ...a, id: nextId('af'), status: a.status || 'ativo',
          percentualComissao: a.percentualComissao ?? 15,
          tagSlug: slugify(a.nome), criadoEm: Date.now(),
        }],
      }
    }

    case 'SET_PRODUCTS':
      return { ...state, products: action.products }

    case 'SAVE_TEAM_MEMBER': {
      const m = action.member
      if (m.id) return { ...state, team: state.team.map(x => x.id === m.id ? { ...x, ...m } : x) }
      return { ...state, team: [...state.team, { ...m, id: nextId('u') }] }
    }

    case 'CLOSE_MONTH':
      return { ...state, closings: { ...state.closings, [action.monthKey]: { status: 'pago', fechadoEm: Date.now() } } }

    case 'WHATSAPP_STATUS':
      return { ...state, whatsapp: { ...state.whatsapp, ...action.patch } }

    case 'TOAST':
      return { ...state, toasts: [...state.toasts, { id: nextId('t'), texto: action.texto, kind: action.kind || 'ok' }] }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }

    case 'RESET_DEMO': {
      localStorage.removeItem(STORAGE_KEY)
      return { ...buildDemoState(), user: state.user }
    }

    default:
      return state
  }
}

function init() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const s = JSON.parse(saved)
      if (s && s.leads && s.affiliates) return { ...s, toasts: [] }
    }
  } catch { /* estado corrompido -> demo limpo */ }
  return buildDemoState()
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, init)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, toasts: [] })) } catch { /* quota */ }
  }, [state])

  return <StoreCtx.Provider value={{ state, dispatch }}>{children}</StoreCtx.Provider>
}

export function useStore() {
  return useContext(StoreCtx)
}

export function toast(dispatch, texto, kind = 'ok') {
  dispatch({ type: 'TOAST', texto, kind })
}

// ---------- seletores / métricas ----------

export function leadsOf(state, afiliadoId) {
  return state.leads.filter(l => l.afiliadoId === afiliadoId)
}

export function funnelCounts(leads) {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, ganho: 0, perdido: 0 }
  leads.forEach(l => { c[l.etapa] = (c[l.etapa] || 0) + 1 })
  return c
}

export function affiliateMetrics(state, afiliadoId) {
  const leads = leadsOf(state, afiliadoId)
  const sales = state.sales.filter(s => s.afiliadoId === afiliadoId)
  const ganhos = leads.filter(l => l.etapa === 'ganho').length
  const fechados = ganhos + leads.filter(l => l.etapa === 'perdido').length
  return {
    leads: leads.length,
    funil: funnelCounts(leads),
    vendasQtd: sales.length,
    vendasValor: sales.reduce((s, v) => s + v.valor, 0),
    comissao: sales.reduce((s, v) => s + v.comissaoCalculada, 0),
    conversao: leads.length ? (ganhos / leads.length) * 100 : 0,
    fechados,
  }
}
