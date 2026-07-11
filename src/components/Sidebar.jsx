import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { Avatar } from './ui.jsx'

const I = {
  dash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  kanban: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="12" rx="1.5"/><rect x="17" y="3" width="5" height="8" rx="1.5"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-9 8.4 8.5 8.5 0 01-3.4-.7L3 21l1.8-5.6a8.38 8.38 0 01-.8-3.9 8.5 8.5 0 118.5 8.5"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  wa: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

const NAV_BY_ROLE = {
  admin: [
    { id: 'dashboard', label: 'Dashboard Geral', icon: I.dash },
    { id: 'kanban', label: 'Funil / Kanban', icon: I.kanban },
    { id: 'conversas', label: 'Conversas', icon: I.chat },
    { id: 'afiliados', label: 'Afiliados', icon: I.users },
    { id: 'fechamento', label: 'Fechamento', icon: I.money },
    { id: 'whatsapp', label: 'WhatsApp', icon: I.wa },
    { id: 'config', label: 'Configurações', icon: I.gear },
  ],
  comercial: [
    { id: 'kanban', label: 'Funil / Kanban', icon: I.kanban },
    { id: 'conversas', label: 'Conversas', icon: I.chat },
  ],
  afiliado: [
    { id: 'portal', label: 'Meu Painel', icon: I.star },
    { id: 'extrato', label: 'Minhas Comissões', icon: I.money },
  ],
}

export default function Sidebar({ route, setRoute }) {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const user = state.user
  const items = NAV_BY_ROLE[user.papel] || []
  const unread = state.leads.filter(l => l.respondeu).length

  return (
    <>
      <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          {/* Logo do selo: substituir pelo upload em /assets/logo-aeternum.png */}
          <div className="brand-logo"><span>Æ</span></div>
          <div className="brand-name">ÆTERNUM<small>PEPTIDES · CRM</small></div>
        </div>
        <nav className="nav">
          {items.map(it => (
            <button
              key={it.id}
              className={`nav-item ${route === it.id ? 'active' : ''}`}
              onClick={() => { setRoute(it.id); setOpen(false) }}
            >
              {it.icon}{it.label}
              {it.id === 'conversas' && unread > 0 && <span className="nav-badge">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <Avatar name={user.nome} sm />
          <div className="who">
            <b>{user.nome}</b>
            <span>{user.papel}</span>
          </div>
          <button className="logout-btn" onClick={() => dispatch({ type: 'LOGOUT' })}>Sair</button>
        </div>
      </aside>
    </>
  )
}
