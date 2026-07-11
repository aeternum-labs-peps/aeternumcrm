import React, { useState } from 'react'
import { useStore, toast } from '../store.jsx'
import { Chip, Modal } from '../components/ui.jsx'
import { parseIntroMessage } from '../lib/parser.js'

// Mensagens de exemplo da Seção 5.1 — demonstram a auto-etiquetagem
const DEMO_MESSAGES = [
  { nome: 'Cliente Novo 1', fone: '5511911112201', texto: 'Olá tudo bem? Eu venho pelo Instagram do Lucas Gomes e quero comprar a Reta' },
  { nome: 'Cliente Novo 2', fone: '5521922223302', texto: 'Olá tudo bem? Eu venho pelo Instagram da Thaís e quero comprar a Reta' },
  { nome: 'Cliente Novo 3', fone: '5531933334403', texto: 'Olá tudo bem? Eu venho pelo Carol e quero comprar a Reta' },
  { nome: 'Cliente Novo 4', fone: '5541944445504', texto: 'Olá tudo bem? Eu venho pelo Instagram do Levy e quero comprar a Reta' },
  { nome: 'Cliente Novo 5', fone: '5551955556605', texto: 'Oi! Eu venho pela Bianca Duarte e quero comprar o BPC-157' },
]

export default function Config() {
  const { state, dispatch } = useStore()
  const [testMsg, setTestMsg] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [newProduct, setNewProduct] = useState('')
  const [member, setMember] = useState(null)
  const [customPhoneSeq, setCustomPhoneSeq] = useState(90)

  const testParser = () => {
    setTestResult({ parsed: parseIntroMessage(testMsg, state.products), texto: testMsg })
  }

  const simulate = (msg) => {
    dispatch({ type: 'RECEIVE_WHATSAPP', texto: msg.texto, telefone: msg.fone, nome: msg.nome })
    const parsed = parseIntroMessage(msg.texto, state.products)
    if (parsed) {
      const exists = state.affiliates.some(a => a.nome.toLowerCase() === parsed.afiliadoNome.toLowerCase())
      toast(dispatch,
        exists
          ? `📥 Lead etiquetado: ⭐ ${parsed.afiliadoNome} · ${parsed.produto}`
          : `📥 Novo afiliado "${parsed.afiliadoNome}" criado automaticamente + lead etiquetado!`,
        'win')
    } else {
      toast(dispatch, '📥 Lead recebido sem padrão de afiliado — enviado para triagem manual', 'warn')
    }
  }

  const simulateCustom = () => {
    if (!testMsg.trim()) return
    simulate({ nome: `Cliente Teste ${customPhoneSeq}`, fone: `55119888877${customPhoneSeq}`, texto: testMsg })
    setCustomPhoneSeq(s => s + 1)
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
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="section-title">⚡ Simular chegada de mensagem (demo)</h2>
            <p style={{ color: 'var(--text-300)', fontSize: 12.5, marginBottom: 12 }}>
              Dispara o mesmo fluxo do webhook real: parse → etiqueta → lead na Etapa 1 do Kanban.
            </p>
            {DEMO_MESSAGES.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 9 }}>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text-300)', fontStyle: 'italic', minWidth: 0 }}>"{m.texto}"</div>
                <button className="btn btn-ghost btn-sm" onClick={() => simulate(m)} style={{ flexShrink: 0 }}>Receber ➤</button>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="section-title">🧪 Testar o parser de etiquetagem</h2>
            <textarea className="input" rows={3} placeholder='Ex.: "Olá! Venho pela Maria Souza e quero comprar o TB-500"'
              value={testMsg} onChange={e => setTestMsg(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={testParser} disabled={!testMsg.trim()}>Analisar</button>
              <button className="btn btn-ghost btn-sm" onClick={simulateCustom} disabled={!testMsg.trim()}>Analisar + criar lead</button>
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

          <div className="card">
            <h2 className="section-title">Demo</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-danger btn-sm" onClick={() => { dispatch({ type: 'CLEAR_DEMO_LEADS' }); toast(dispatch, 'Leads fictícios apagados — só os reais ficaram ✓') }}>
                Apagar leads fictícios (ficar só com os reais)
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { dispatch({ type: 'RESET_DEMO' }); toast(dispatch, 'Dados demo restaurados ✓') }}>
                Restaurar dados de demonstração
              </button>
            </div>
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
