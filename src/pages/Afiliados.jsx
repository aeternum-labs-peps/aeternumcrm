import React, { useState } from 'react'
import { useStore, affiliateMetrics, toast } from '../store.jsx'
import { Chip, Avatar, Modal } from '../components/ui.jsx'
import { money, pct, fmtDate } from '../lib/format.js'

export default function Afiliados({ openAffiliate }) {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState(null) // objeto afiliado ou {} para novo

  const save = () => {
    if (!editing.nome?.trim()) return
    dispatch({ type: 'SAVE_AFFILIATE', affiliate: { ...editing, percentualComissao: +editing.percentualComissao || 15 } })
    toast(dispatch, editing.id ? 'Afiliado atualizado ✓' : `Afiliado ${editing.nome} criado ✓`)
    setEditing(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Afiliados</h1>
          <p className="page-sub">Influenciadores que geram leads via WhatsApp — novos afiliados também são criados automaticamente pela etiquetagem</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ nome: '', instagram: '', percentualComissao: 15, status: 'ativo' })}>+ Novo Afiliado</button>
      </div>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Afiliado</th><th>Tag</th><th>Status</th>
              <th className="num">Leads</th><th className="num">Vendas</th>
              <th className="num">Receita</th><th className="num">Conversão</th>
              <th className="num">Comissão %</th><th className="num">A receber</th><th></th>
            </tr>
          </thead>
          <tbody>
            {state.affiliates.map(a => {
              const m = affiliateMetrics(state, a.id)
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={a.nome} sm />
                      <div><b>{a.nome}</b><br /><span style={{ color: 'var(--text-300)', fontSize: 11 }}>{a.instagram} · desde {fmtDate(a.criadoEm)}</span></div>
                    </div>
                  </td>
                  <td><Chip>⭐ {a.tagSlug}</Chip></td>
                  <td>
                    <Chip kind={a.status === 'ativo' ? 'win' : 'lost'}>{a.status}</Chip>
                  </td>
                  <td className="num">{m.leads}</td>
                  <td className="num">{m.vendasQtd}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{money(m.vendasValor)}</td>
                  <td className="num">{pct(m.conversao)}</td>
                  <td className="num">{a.percentualComissao}%</td>
                  <td className="num" style={{ color: 'var(--rose-gold-light)', fontWeight: 800 }}>{money(m.comissao)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openAffiliate(a.id)}>Ver painel</button>{' '}
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ ...a })}>Editar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? `Editar ${editing.nome}` : 'Novo Afiliado'}
          sub="O afiliado ganha uma etiqueta automática e uma página de acompanhamento própria."
          onClose={() => setEditing(null)}>
          <label className="fld">Nome</label>
          <input className="input" value={editing.nome} autoFocus onChange={e => setEditing({ ...editing, nome: e.target.value })} placeholder="Ex.: Lucas Gomes" />
          <label className="fld">Instagram</label>
          <input className="input" value={editing.instagram || ''} onChange={e => setEditing({ ...editing, instagram: e.target.value })} placeholder="@usuario" />
          <label className="fld">Comissão (%)</label>
          <input className="input" type="number" min="0" max="100" value={editing.percentualComissao}
            onChange={e => setEditing({ ...editing, percentualComissao: e.target.value })} />
          <label className="fld">Status</label>
          <select className="input" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
