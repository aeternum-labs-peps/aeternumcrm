// ============================================================
// CLIENTE DO CRM — todas as chamadas passam pelo "porteiro"
// (Edge Function zapi-proxy no Supabase). As credenciais do
// Z-API ficam no servidor; o navegador só carrega o código de
// acesso que a pessoa digita no login.
// ============================================================

const PROXY = 'https://bliopxeidpmnwwalmegq.supabase.co/functions/v1/zapi-proxy'

export const getCrmKey = () => localStorage.getItem('aeternum-crm-key') || ''
export const setCrmKey = k => localStorage.setItem('aeternum-crm-key', k)
export const clearCrmKey = () => localStorage.removeItem('aeternum-crm-key')

// Valida a senha no servidor e retorna qual painel ela abre
export async function crmLogin(password) {
  const r = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-crm-key': password },
    body: JSON.stringify({ action: 'login' }),
  })
  if (r.status === 403) throw new Error('senha incorreta')
  if (!r.ok) throw new Error(`servidor ${r.status}`)
  return r.json() // { role, name, affiliateId }
}

async function call(action, params = {}) {
  const r = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-crm-key': getCrmKey() },
    body: JSON.stringify({ action, ...params }),
  })
  if (r.status === 403) throw new Error('Código de acesso inválido')
  if (!r.ok) throw new Error(`Servidor ${r.status}`)
  return r.json()
}

export const zapiStatus = () => call('status')
export const zapiQr = () => call('qr')
export const zapiSendText = (phone, message) => call('send-text', { phone, message })
export const supaNewMessages = (afterId = 0) => call('new-messages', { afterId })

// ---- banco central do CRM ----
export const getCrm = () => call('get-crm')
export const saveLead = lead => call('save-lead', { lead })
export const saveAffiliate = affiliate => call('save-affiliate', { affiliate })
export const saveConfig = config => call('save-config', { config })

// Converte a linha de mensagem do banco para o formato do CRM
export function normalizeDbMsg(row) {
  return {
    id: row.message_id || `db-${row.id}`,
    phone: String(row.phone || ''),
    direcao: row.from_me ? 'enviada' : 'recebida',
    texto: row.texto || '',
    timestamp: Number(row.momment) || Date.now(),
    remetente: row.sender_name || row.phone,
  }
}

// ---- conversão banco (snake_case) <-> app (camelCase) ----
export function rowToLead(r) {
  const et = (r.etapa === 'ganho' || r.etapa === 'perdido') ? r.etapa : Number(r.etapa)
  return {
    id: r.id, nome: r.nome, telefone: String(r.telefone || ''),
    afiliadoId: r.afiliado_id, produtoInteresse: r.produto, etapa: et,
    responsavelId: r.responsavel_id, valorVenda: r.valor_venda != null ? Number(r.valor_venda) : null,
    motivoPerda: r.motivo_perda, criadoEm: Number(r.criado_em), etapaDesde: Number(r.etapa_desde),
    ultimaAtualizacao: Number(r.ultima_atualizacao), respondeu: !!r.respondeu, origemMensagem: r.origem || '',
  }
}
export function leadToRow(l) {
  return {
    id: l.id, nome: l.nome, telefone: String(l.telefone || ''), afiliado_id: l.afiliadoId,
    produto: l.produtoInteresse, etapa: String(l.etapa), responsavel_id: l.responsavelId,
    valor_venda: l.valorVenda, motivo_perda: l.motivoPerda, criado_em: l.criadoEm,
    etapa_desde: l.etapaDesde, ultima_atualizacao: l.ultimaAtualizacao, respondeu: l.respondeu, origem: l.origemMensagem,
  }
}
export function rowToAff(r) {
  return {
    id: r.id, nome: r.nome, instagram: r.instagram, status: r.status || 'ativo',
    percentualComissao: r.percentual_comissao ?? 15, tagSlug: r.tag_slug, criadoEm: Number(r.criado_em),
  }
}
export function affToRow(a) {
  return {
    id: a.id, nome: a.nome, instagram: a.instagram, status: a.status || 'ativo',
    percentual_comissao: a.percentualComissao ?? 15, tag_slug: a.tagSlug, criado_em: a.criadoEm,
  }
}
