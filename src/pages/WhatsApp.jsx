import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store.jsx'
import { Chip } from '../components/ui.jsx'
import { zapiStatus, zapiQr } from '../lib/zapi.js'

const STEPS = [
  'Abra o WhatsApp no seu celular',
  'Toque em Configurações → Aparelhos conectados',
  'Toque em "Conectar um aparelho"',
  'Aponte a câmera para o QR Code',
]

export default function WhatsApp() {
  const { state, dispatch } = useStore()
  const wa = state.whatsapp
  const [qr, setQr] = useState(null)
  const [erro, setErro] = useState(null)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  useEffect(() => { checkStatus() }, []) // eslint-disable-line

  async function checkStatus() {
    setErro(null)
    try {
      const s = await zapiStatus()
      if (!alive.current) return
      dispatch({ type: 'WHATSAPP_STATUS', patch: { status: s.connected ? 'conectado' : 'desconectado', importado: true } })
      if (!s.connected) {
        try {
          const q = await zapiQr()
          if (alive.current && q?.value) setQr(q.value.startsWith('data:') ? q.value : `data:image/png;base64,${q.value}`)
        } catch { /* QR indisponível — instruções seguem valendo */ }
      }
    } catch (e) {
      if (!alive.current) return
      dispatch({ type: 'WHATSAPP_STATUS', patch: { status: 'desconectado' } })
      setErro('Não consegui verificar a conexão: ' + e.message)
    }
  }

  const statusChip = {
    desconectado: <Chip kind="lost"><span className="status-dot" style={{ background: 'var(--lost)' }} /> Desconectado</Chip>,
    sincronizando: <Chip kind="warn"><span className="status-dot" style={{ background: 'var(--warn)' }} /> Sincronizando…</Chip>,
    conectado: <Chip kind="win"><span className="status-dot" style={{ background: 'var(--win)' }} /> Conectado (Z-API)</Chip>,
  }[wa.status]

  return (
    <div>
      <h1 className="page-title">Conexão WhatsApp</h1>
      <p className="page-sub">Conexão real via Z-API — mensagens novas entram no funil automaticamente</p>

      <div className="grid-2">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{statusChip}</div>

          {erro && (
            <p style={{ color: '#E08983', fontSize: 12.5, margin: '10px 0', padding: 10, background: 'rgba(180,84,78,0.1)', borderRadius: 10 }}>{erro}</p>
          )}

          {wa.status === 'conectado' ? (
            <div style={{ padding: '26px 10px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <b>Seu WhatsApp está conectado!</b>
              <p style={{ color: 'var(--text-300)', fontSize: 12.5, margin: '10px 0 18px' }}>
                Toda mensagem recebida vira lead etiquetado no funil em até 15 segundos (com o CRM aberto).
              </p>
              <button className="btn btn-ghost btn-sm" onClick={checkStatus}>Atualizar status</button>
            </div>
          ) : (
            <>
              {qr
                ? <div className="qr-box"><img src={qr} alt="QR Code de conexão" style={{ width: '100%', height: '100%' }} /></div>
                : <p style={{ color: 'var(--text-300)', fontSize: 13, margin: '26px 0' }}>
                    Escaneie o QR Code no painel do Z-API (z-api.io) com o WhatsApp da operação.
                  </p>}
              <button className="btn btn-primary" onClick={checkStatus}>Verificar conexão</button>
            </>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Como conectar (se desconectar)</h2>
            <ol style={{ paddingLeft: 20, color: 'var(--text-300)', lineHeight: 2 }}>
              {STEPS.map(s => <li key={s}>{s}</li>)}
            </ol>
          </div>
          <div className="card">
            <h2 className="section-title">Como funciona</h2>
            <ul style={{ paddingLeft: 20, color: 'var(--text-300)', lineHeight: 1.9, fontSize: 13 }}>
              <li><b style={{ color: 'var(--text-100)' }}>Recebimento</b> — cada mensagem nova vira/atualiza um lead, já etiquetado pelo afiliado</li>
              <li><b style={{ color: 'var(--text-100)' }}>Deduplicação</b> — um lead por número de telefone</li>
              <li><b style={{ color: 'var(--text-100)' }}>Envio</b> — respostas da aba Conversas saem pelo WhatsApp real</li>
              <li><b style={{ color: 'var(--text-100)' }}>Histórico antigo</b> — mensagens de antes da conexão não entram (limitação do WhatsApp multi-dispositivos)</li>
            </ul>
            <hr className="divider-gold" />
            <p style={{ color: 'var(--text-300)', fontSize: 11.5 }}>
              Segurança: o site publicado não carrega as credenciais do Z-API — tudo passa pelo porteiro (Supabase Edge Function) que exige o código de acesso do time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
