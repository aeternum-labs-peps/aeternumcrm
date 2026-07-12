import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { slugify } from './lib/parser.js'
import {
  getCrm, saveLead, saveAffiliate, saveConfig,
  rowToLead, leadToRow, rowToAff, affToRow,
} from './lib/zapi.js'

// ============================================================
// STORE — sincronizado com o banco central (Supabase via porteiro).
// Toda mutação atualiza a tela na hora (otimista) e é empurrada
// para o banco; um poll traz de volta o que os outros mudaram.
// ============================================================

const StoreCtx = createContext(null)

export const STAGES = [
  { id: 1, nome: 'Novo Lead' },
  { id: 2, nome: 'Contato Iniciado' },
  { id: 3, nome: 'Qualificado' },
  { id: 4, nome: 'Proposta Enviada' },
  { id: 5, nome: 'Negociação' },
  { id: 6, nome: 'Fechamento' },
]

const DEFAULT_PRODUCTS = ['Retatrutide', 'SLU-PP-332', 'MOTS-C', 'Selank', 'GH Somatropina', 'SS-31', 'GHK-Cu', 'BPC-157', 'TB-500']

let idSeq = 1000
const nextId = p => `${p}-${Date.now()}-${++idSeq}-${Math.random().toString(36).slice(2, 5)}`
const digits = s => String(s || '').replace(/\D/g, '')

function emptyState() {
  return {
    user: null,
    affiliates: [], leads: [], messages: [],
    products: DEFAULT_PRODUCTS, team: [], closings: {},
    whatsapp: { status: 'desconectado', importado: true },
    toasts: [], _push: [], loaded: false,
  }
}

const configOf = s => ({ closings: s.closings, products: s.products, team: s.team })

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.user }
    case 'LOGOUT':
      return { ...emptyState() }

    case 'SYNC_CRM': {
      // Banco central é a fonte da verdade. Não sobrescreve enquanto
      // houver mudanças locais ainda não empurradas (evita "voltar" card).
      if (state._push.length) return state
      const { affiliates, leads, config } = action.data
      return {
        ...state,
        affiliates: affiliates.map(rowToAff),
        leads: leads.map(rowToLead),
        products: (config?.products?.length ? config.products : state.products),
        team: config?.team || state.team,
        closings: config?.closings || {},
        loaded: true,
      }
    }

    case 'MERGE_MESSAGES': {
      const known = new Set(state.messages.map(m => m.id))
      const fresh = action.messages.filter(m => !known.has(m.id))
      if (!fresh.length) return state
      // marca lead como "respondeu" quando chega mensagem recebida
      const incomingPhones = new Set(fresh.filter(m => m.direcao === 'recebida').map(m => digits(m.phone)))
      const leads = incomingPhones.size
        ? state.leads.map(l => incomingPhones.has(digits(l.telefone)) ? { ...l, respondeu: true } : l)
        : state.leads
      return { ...state, messages: [...state.messages, ...fresh], leads }
    }

    case 'MOVE_LEAD': {
      const { leadId, etapa, valorVenda, motivoPerda } = action
      let moved = null
      const leads = state.leads.map(l => {
        if (l.id !== leadId) return l
        moved = {
          ...l, etapa, etapaDesde: Date.now(), ultimaAtualizacao: Date.now(),
          valorVenda: etapa === 'ganho' ? valorVenda : null,
          motivoPerda: etapa === 'perdido' ? motivoPerda : null,
          respondeu: false,
        }
        return moved
      })
      return { ...state, leads, _push: moved ? [...state._push, { kind: 'lead', payload: leadToRow(moved) }] : state._push }
    }

    case 'ASSIGN_LEAD': {
      let changed = null
      const leads = state.leads.map(l => {
        if (l.id !== action.leadId) return l
        changed = { ...l, responsavelId: action.responsavelId, ultimaAtualizacao: Date.now() }
        return changed
      })
      return { ...state, leads, _push: changed ? [...state._push, { kind: 'lead', payload: leadToRow(changed) }] : state._push }
    }

    case 'SEND_MESSAGE': {
      const lead = state.leads.find(l => l.id === action.leadId)
      const msg = {
        id: nextId('msg'), phone: lead ? lead.telefone : '', direcao: 'enviada',
        texto: action.texto, timestamp: Date.now(), remetente: state.user?.nome || 'ÆTERNUM',
      }
      let changed = null
      const leads = state.leads.map(l => {
        if (l.id !== action.leadId) return l
        changed = { ...l, ultimaAtualizacao: Date.now(), respondeu: false }
        return changed
      })
      return {
        ...state, messages: [...state.messages, msg], leads,
        _push: changed ? [...state._push, { kind: 'lead', payload: leadToRow(changed) }] : state._push,
      }
    }

    case 'MARK_READ': {
      let changed = null
      const leads = state.leads.map(l => {
        if (l.id !== action.leadId || !l.respondeu) return l
        changed = { ...l, respondeu: false }
        return changed
      })
      return { ...state, leads, _push: changed ? [...state._push, { kind: 'lead', payload: leadToRow(changed) }] : state._push }
    }

    case 'SAVE_AFFILIATE': {
      const a = action.affiliate
      let saved
      let affiliates
      if (a.id) {
        saved = { ...state.affiliates.find(x => x.id === a.id), ...a }
        affiliates = state.affiliates.map(x => x.id === a.id ? saved : x)
      } else {
        saved = {
          ...a, id: nextId('af'), status: a.status || 'ativo',
          percentualComissao: a.percentualComissao ?? 15,
          tagSlug: slugify(a.nome), criadoEm: Date.now(),
        }
        affiliates = [...state.affiliates, saved]
      }
      return { ...state, affiliates, _push: [...state._push, { kind: 'affiliate', payload: affToRow(saved) }] }
    }

    case 'SET_PRODUCTS': {
      const s = { ...state, products: action.products }
      return { ...s, _push: [...state._push, { kind: 'config', payload: configOf(s) }] }
    }

    case 'SAVE_TEAM_MEMBER': {
      const m = action.member
      const team = m.id ? state.team.map(x => x.id === m.id ? { ...x, ...m } : x) : [...state.team, { ...m, id: nextId('u') }]
      const s = { ...state, team }
      return { ...s, _push: [...state._push, { kind: 'config', payload: configOf(s) }] }
    }

    case 'CLOSE_MONTH': {
      const s = { ...state, closings: { ...state.closings, [action.monthKey]: { status: 'pago', fechadoEm: Date.now() } } }
      return { ...s, _push: [...state._push, { kind: 'config', payload: configOf(s) }] }
    }

    case 'PUSH_DONE':
      return { ...state, _push: state._push.slice(action.count) }

    case 'WHATSAPP_STATUS':
      return { ...state, whatsapp: { ...state.whatsapp, ...action.patch } }

    case 'TOAST':
      return { ...state, toasts: [...state.toasts, { id: nextId('t'), texto: action.texto, kind: action.kind || 'ok' }] }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }

    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, emptyState)
  const flushing = useRef(false)

  // Empurra mudanças locais para o banco central
  useEffect(() => {
    if (!state._push.length || flushing.current || !state.user) return
    flushing.current = true
    const batch = state._push.slice()
    ;(async () => {
      for (const item of batch) {
        try {
          if (item.kind === 'lead') await saveLead(item.payload)
          else if (item.kind === 'affiliate') await saveAffiliate(item.payload)
          else if (item.kind === 'config') await saveConfig(item.payload)
        } catch { /* tenta de novo no próximo ciclo */ }
      }
      dispatch({ type: 'PUSH_DONE', count: batch.length })
      flushing.current = false
    })()
  }, [state._push, state.user])

  // Carga inicial + poll do banco central (mantém tudo ao vivo)
  useEffect(() => {
    if (!state.user) return
    let stop = false
    const pull = async () => {
      try {
        const data = await getCrm()
        if (!stop) dispatch({ type: 'SYNC_CRM', data })
      } catch { /* sem internet — tenta no próximo ciclo */ }
    }
    pull()
    const iv = setInterval(pull, 12000)
    return () => { stop = true; clearInterval(iv) }
  }, [state.user])

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

// Vendas derivadas dos leads ganhos (não há tabela separada)
export function salesOf(state, afiliadoId) {
  return state.leads
    .filter(l => l.etapa === 'ganho' && l.valorVenda && (!afiliadoId || l.afiliadoId === afiliadoId))
    .map(l => {
      const af = state.affiliates.find(a => a.id === l.afiliadoId)
      const pct = af ? af.percentualComissao : 15
      return {
        id: 'vd-' + l.id, leadId: l.id, afiliadoId: l.afiliadoId,
        valor: l.valorVenda, produto: l.produtoInteresse, data: l.etapaDesde,
        comissaoCalculada: +(l.valorVenda * pct / 100).toFixed(2),
      }
    })
}

export function funnelCounts(leads) {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, ganho: 0, perdido: 0 }
  leads.forEach(l => { c[l.etapa] = (c[l.etapa] || 0) + 1 })
  return c
}

export function affiliateMetrics(state, afiliadoId) {
  const leads = leadsOf(state, afiliadoId)
  const sales = salesOf(state, afiliadoId)
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
