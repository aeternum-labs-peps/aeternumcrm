import React, { useState } from 'react'
import { useStore, toast } from '../store.jsx'
import { Chip, Modal } from '../components/ui.jsx'
import { parseIntroMessage } from '../lib/parser.js'

export default function Config() {
  const { state, dispatch } = useStore()
  const [testMsg, setTestMsg] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [newProduct, setNewProduct] = useState('')
  const [member, setMember] = useState(null)

  const testParser = () => {
    setTestResult({ parsed: parseIntroMessage(testMsg, state.products), texto: testMsg })
  }

  const addProduct = () => {
    const p = newProduct.trim()
    if (!p || state.products.includes(p)) return
    dispatch({ type: 'SET_PRODUCTS', products: [...state.products, p] })
    setNewProduct('')
    toast(dispatch, `Produto "${p}" adicionado ao catálogo ✓`)
  }

  const saveMember = () => {
    if (!member.nome?.trim()) return
    dispatch({ type: 'SAVE_TEAM_MEMBER', member })
    toast(dispatch, 'Time comercial atualizado ✓')
    setMember(null)
  }

  return (
    <div>
      <h1 className="page-title">Configurações</h1>
      <p className="page-sub">Regras de etiquetagem, catálogo de produtos e time comercial</p>

      <div className="grid-2">
        <div>
          <div className="card">
            <h2 className="section-title">🧪 Testar a etiquetagem automática</h2>
            <p style={{ color: 'var(--text-300)', fontSize: 12.5, marginBottom: 12 }}>
              Cole uma mensagem para ver qual afiliado e produto o sistema reconhece (só teste, não cria lead).
            </p>
            <textarea className="input" rows={3} placeholder='Ex.: "Olá! Venho pela Maria Souza e quero comprar o TB-500"'
              value={testMsg} onChange={e => setTestMsg(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={testParser} disabled={!testMsg.trim()}>Analisar</button>
            </div>
            {testResult && (
              <div style={{ marginTop: 14, padding: 13, background: 'var(--navy-900)', borderRadius: 12, border: 'var(--card-border)' }}>
                {testResult.parsed ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5 }}>Detectado:</span>
                    <Chip>⭐ {testResult.parsed.afiliadoNome}</Chip>
                    <Chip kind="gray">{testResult.parsed.produto}</Chip>
                  </div>
                ) : (
                  <Chip kind="warn">Nenhum padrão detectado → triagem manual</Chip>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">Catálogo de Produtos</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {state.products.map(p => (
                <Chip key={p} kind="gray">{p}{' '}
                  <button aria-label={`Remover ${p}`} onClick={() => dispatch({ type: 'SET_PRODUCTS', products: state.products.filter(x => x !== p) })}
                    style={{ background: 'none', border: 'none', color: 'var(--lost)', fontWeight: 800, marginLeft: 2 }}>×</button>
                </Chip>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input" placeholder="Novo produto..." value={newProduct}
                onChange={e => setNewProduct(e.target.value)} onKeyDown={e => e.key === 'Enter' && addProduct()} />
              <button className="btn btn-primary btn-sm" onClick={addProduct}>Adicionar</button>
            </div>
            <p style={{ color: 'var(--text-300)', fontSize: 11.5, marginTop: 10 }}>
              Apelidos reconhecidos: "Reta" → Retatrutide, "GH" → GH Somatropina, "BPC" → BPC-157…
            </p>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Time Comercial</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setMember({ nome: '', papel: 'comercial' })}>+ Adicionar</button>
            </div>
            {state.team.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(195,200,208,0.07)' }}>
                <div><b style={{ fontSize: 13 }}>{t.nome}</b> <Chip kind={t.papel === 'admin' ? '' : 'gray'}>{t.papel}</Chip></div>
                <button className="btn btn-ghost btn-sm" onClick={() => setMember({ ...t })}>Editar</button>
              </div>
            ))}
          </div>

        </div>
      </div>

      {member && (
        <Modal title={member.id ? 'Editar membro' : 'Novo membro do time'} onClose={() => setMember(null)}>
          <label className="fld">Nome</label>
          <input className="input" autoFocus value={member.nome} onChange={e => setMember({ ...member, nome: e.target.value })} />
          <label className="fld">Papel</label>
          <select className="input" value={member.papel} onChange={e => setMember({ ...member, papel: e.target.value })}>
            <option value="comercial">Comercial</option>
            <option value="admin">Admin</option>
          </select>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setMember(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={saveMember}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
