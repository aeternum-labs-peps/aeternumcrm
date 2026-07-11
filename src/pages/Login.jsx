import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { getCrmKey, setCrmKey, clearCrmKey, zapiStatus } from '../lib/zapi.js'

export default function Login() {
  const { state, dispatch } = useStore()
  const [pickAff, setPickAff] = useState(false)
  const [unlocked, setUnlocked] = useState(!!getCrmKey())
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [codeError, setCodeError] = useState(null)

  const login = user => dispatch({ type: 'LOGIN', user })

  const videoBg = (
    <>
      <video className="login-video" autoPlay muted loop playsInline
        src={`${import.meta.env.BASE_URL}assets/login-bg.mp4`} />
      <div className="login-overlay" />
    </>
  )

  // Valida o código de acesso no servidor antes de liberar o CRM
  const unlock = async () => {
    if (!code.trim()) return
    setChecking(true)
    setCodeError(null)
    setCrmKey(code.trim())
    try {
      await zapiStatus()
      setUnlocked(true)
    } catch (e) {
      clearCrmKey()
      setCodeError(String(e.message).includes('inválido')
        ? 'Código de acesso incorreto. Confira com o administrador.'
        : 'Não consegui verificar (internet?). Tente de novo.')
    } finally {
      setChecking(false)
    }
  }

  if (!unlocked) {
    return (
      <div className="login-wrap">
        {videoBg}
        <div className="card login-card">
          <div className="login-logo"><img src={`${import.meta.env.BASE_URL}assets/logo-aeternum.png`} alt="ÆTERNUM LABS" /></div>
          <h1 className="login-title">ÆTERNUM</h1>
          <div className="login-sub">Peptides · CRM</div>
          <label className="fld" htmlFor="codigo" style={{ textAlign: 'left' }}>Código de acesso do time</label>
          <input id="codigo" className="input" type="password" autoFocus placeholder="••••••••••"
            value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlock()} />
          {codeError && <p style={{ color: '#E08983', fontSize: 12.5, marginTop: 10 }}>{codeError}</p>}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={unlock} disabled={checking || !code.trim()}>
            {checking ? 'Verificando…' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrap">
      {videoBg}
      <div className="card login-card">
        {/* Logo do selo: substituir pelo upload em /assets/logo-aeternum.png */}
        <div className="login-logo"><img src={`${import.meta.env.BASE_URL}assets/logo-aeternum.png`} alt="ÆTERNUM LABS" /></div>
        <h1 className="login-title">ÆTERNUM</h1>
        <div className="login-sub">Peptides · CRM</div>

        {!pickAff ? (
          <>
            <button className="role-btn" onClick={() => login({ id: 'u-admin', nome: 'Dharman Carneiro', papel: 'admin' })}>
              <div className="role-ico">👑</div>
              <div><b>Admin / Gestor</b><span>Visão total: métricas, afiliados, comissões</span></div>
            </button>
            <button className="role-btn" onClick={() => login({ id: 'u-com1', nome: 'Rafael Costa', papel: 'comercial' })}>
              <div className="role-ico">💼</div>
              <div><b>Comercial</b><span>Kanban de leads e conversas do WhatsApp</span></div>
            </button>
            <button className="role-btn" onClick={() => setPickAff(true)}>
              <div className="role-ico">⭐</div>
              <div><b>Afiliado / Influenciador</b><span>Meu funil, minhas vendas e comissões</span></div>
            </button>
            <p style={{ color: 'var(--text-300)', fontSize: 11.5, marginTop: 18 }}>
              Escolha o seu perfil de trabalho.
            </p>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-300)', fontSize: 13, marginBottom: 14 }}>Entrar como qual afiliado?</p>
            {state.affiliates.map(a => (
              <button key={a.id} className="role-btn"
                onClick={() => login({ id: `u-${a.id}`, nome: a.nome, papel: 'afiliado', afiliadoId: a.id })}>
                <div className="role-ico">⭐</div>
                <div><b>{a.nome}</b><span>{a.instagram}</span></div>
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setPickAff(false)}>← Voltar</button>
          </>
        )}
      </div>
    </div>
  )
}
