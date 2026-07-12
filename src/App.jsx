import React, { useState, useEffect } from 'react'
import { useStore } from './store.jsx'
import { supaNewMessages, normalizeDbMsg } from './lib/zapi.js'
import Sidebar from './components/Sidebar.jsx'
import { Toasts } from './components/ui.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Kanban from './pages/Kanban.jsx'
import Conversas from './pages/Conversas.jsx'
import Afiliados from './pages/Afiliados.jsx'
import AfiliadoPainel from './pages/AfiliadoPainel.jsx'
import Fechamento from './pages/Fechamento.jsx'
import WhatsApp from './pages/WhatsApp.jsx'
import Config from './pages/Config.jsx'

const HOME_BY_ROLE = { admin: 'dashboard', comercial: 'kanban', afiliado: 'portal' }

export default function App() {
  const { state, dispatch } = useStore()
  const user = state.user
  const [route, setRoute] = useState('dashboard')
  const [affiliateId, setAffiliateId] = useState(null) // painel individual (admin)
  const [selectedLeadId, setSelectedLeadId] = useState(null)

  useEffect(() => {
    if (user) { setRoute(HOME_BY_ROLE[user.papel]); setAffiliateId(null) }
  }, [user?.id]) // eslint-disable-line

  // ⏱ TEMPO REAL das CONVERSAS: os leads já vêm do banco central (poll no
  // store); aqui só buscamos o TEXTO das mensagens para a aba Conversas.
  // Afiliado não acessa (privacidade dos leads dos outros).
  useEffect(() => {
    if (!user || user.papel === 'afiliado') return
    let stop = false
    const tick = async () => {
      try {
        const lastId = Number(localStorage.getItem('aeternum-crm-lastdbid') || 0)
        const rows = await supaNewMessages(lastId)
        if (stop || !rows.length) return
        dispatch({ type: 'MERGE_MESSAGES', messages: rows.map(normalizeDbMsg).filter(m => m.texto) })
        localStorage.setItem('aeternum-crm-lastdbid', String(rows[rows.length - 1].id))
      } catch { /* sem internet — tenta no próximo ciclo */ }
    }
    tick()
    const iv = setInterval(tick, 15000)
    return () => { stop = true; clearInterval(iv) }
  }, [user?.id]) // eslint-disable-line

  if (!user) return <><Login /><Toasts /></>

  const openAffiliate = id => { setAffiliateId(id); setRoute('afiliado-painel') }
  const openConversation = leadId => { setSelectedLeadId(leadId); setRoute('conversas') }

  const pages = {
    dashboard: <Dashboard setRoute={setRoute} openAffiliate={openAffiliate} />,
    kanban: <Kanban openConversation={openConversation} />,
    conversas: <Conversas selectedLeadId={selectedLeadId} setSelectedLeadId={setSelectedLeadId} />,
    afiliados: <Afiliados openAffiliate={openAffiliate} />,
    'afiliado-painel': <AfiliadoPainel afiliadoId={affiliateId} onBack={() => setRoute('afiliados')} />,
    fechamento: <Fechamento />,
    whatsapp: <WhatsApp />,
    config: <Config />,
    // Portal do afiliado (visão restrita — RLS em produção)
    portal: <AfiliadoPainel afiliadoId={user.afiliadoId} isPortal />,
    extrato: <Fechamento isPortal afiliadoId={user.afiliadoId} />,
  }

  return (
    <div className="app">
      <Sidebar route={route === 'afiliado-painel' ? 'afiliados' : route} setRoute={r => { setRoute(r); setAffiliateId(null) }} />
      <main className="main">{pages[route] || pages[HOME_BY_ROLE[user.papel]]}</main>
      <Toasts />
    </div>
  )
}
