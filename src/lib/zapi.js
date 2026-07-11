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

// Converte a linha do banco para o formato do CRM
export function normalizeDbMsg(row) {
  return {
    id: row.message_id || `db-${row.id}`,
    direcao: row.from_me ? 'enviada' : 'recebida',
    texto: row.texto || '',
    timestamp: Number(row.momment) || Date.now(),
    remetente: row.sender_name || row.phone,
  }
}
