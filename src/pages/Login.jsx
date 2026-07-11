import React, { useState } from 'react'
import { useStore } from '../store.jsx'
import { setCrmKey, clearCrmKey, crmLogin } from '../lib/zapi.js'

// Uma senha = um painel. A validação é feita no servidor (zapi-proxy),
// então a lista de senhas nunca aparece no código do site.
export default function Login() {
  const { dispatch } = useStore()
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [err, setErr] = useState(null)

  const enter = async () => {
    const pass = code.trim()
    if (!pass) return
    setChecking(true)
    setErr(null)
    setCrmKey(pass)
    try {
      const u = await crmLogin(pass)
      if (u.role === 'afiliado') {
        dispatch({ type: 'LOGIN', user: { id: 'u-' + (u.affiliateId || 'af'), nome: u.name, papel: 'afiliado', afiliadoId: u.affiliateId } })
      } else if (u.role === 'comercial') {
        dispatch({ type: 'LOGIN', user: { id: 'u-com-' + u.name.toLowerCase(), nome: u.name, papel: 'comercial' } })
      } else {
        dispatch({ type: 'LOGIN', user: { id: 'u-' + u.name.toLowerCase(), nome: u.name, papel: 'admin' } })
      }
    } catch (e) {
      clearCrmKey()
      setErr(String(e.message).includes('incorreta') || String(e.message).includes('403')
        ? 'Senha incorreta. Confira com o administrador.'
        : 'Não consegui verificar (internet?). Tente de novo.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="login-wrap">
      <video className="login-video" autoPlay muted loop playsInline
        src={`${import.meta.env.BASE_URL}assets/login-bg.mp4`} />
      <div className="login-overlay" />
      <div className="card login-card">
        <div className="login-logo"><img src={`${import.meta.env.BASE_URL}assets/logo-aeternum.png`} alt="ÆTERNUM LABS" /></div>
        <h1 className="login-title">ÆTERNUM</h1>
        <div className="login-sub">Peptides · CRM</div>

        <label className="fld" htmlFor="senha" style={{ textAlign: 'left' }}>Sua senha de acesso</label>
        <input id="senha" className="input" type="password" autoFocus placeholder="••••••••••"
          value={code} onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enter()} />
        {err && <p style={{ color: '#E08983', fontSize: 12.5, marginTop: 10 }}>{err}</p>}
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}
          onClick={enter} disabled={checking || !code.trim()}>
          {checking ? 'Verificando…' : 'Entrar'}
        </button>
        <p style={{ color: 'var(--text-300)', fontSize: 11.5, marginTop: 18 }}>
          Cada senha abre direto o painel do seu perfil.
        </p>
      </div>
    </div>
  )
}
