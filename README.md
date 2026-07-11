# CRM ÆTERNUM PEPTIDES

CRM de gestão de afiliados/influenciadores com integração WhatsApp (modo demo).

## Como rodar

```bash
cd aeternum-crm
bun install
bun run dev
```

Abra http://localhost:5199 e escolha um perfil na tela de login:
- **Admin** — visão total (dashboard, afiliados, fechamento, WhatsApp, configurações)
- **Comercial** — Kanban + conversas
- **Afiliado** — portal restrito (funil próprio, vendas e comissão de 15%)

## Demonstração da auto-etiquetagem

Em **Configurações → Simular chegada de mensagem**, clique em "Receber ➤" para
disparar as mensagens de exemplo ("venho pelo Instagram do Lucas Gomes e quero
comprar a Reta"...). O lead entra etiquetado na Etapa 1 do Kanban; se o afiliado
não existir, ele é criado automaticamente (comissão 15%, tag e painel próprios).

## Logo

Substitua o selo placeholder colocando a imagem em `public/assets/logo-aeternum.png`
e trocando o `<span>Æ</span>` por `<img src="/assets/logo-aeternum.png" />` em
`src/components/Sidebar.jsx` e `src/pages/Login.jsx`.

## Onde plugar a integração real

O app roda 100% em modo demo (dados em `src/data/demo.js`, estado em
localStorage). Pontos de integração comentados no código:

| Peça | Arquivo | Produção |
|---|---|---|
| Parser de etiquetagem | `src/lib/parser.js` | Roda no webhook n8n antes do insert |
| Recebimento de mensagem | `src/store.jsx` (`RECEIVE_WHATSAPP`) | Webhook Evolution API → n8n → Supabase |
| Envio de mensagem | `src/store.jsx` (`SEND_MESSAGE`) | POST Evolution API `/message/sendText` |
| QR + importação de histórico | `src/pages/WhatsApp.jsx` | Evolution API `/instance/connect` + `/chat/findChats` |
| Banco de dados | todo o store | Supabase (PostgreSQL) com RLS por papel/afiliado |

Arquitetura recomendada: **Evolution API** (WhatsApp Web bridge) → **n8n**
(webhook + parser) → **Supabase** (tabelas da Seção 3 do masterprompt, RLS)
→ este frontend (trocar o reducer por chamadas supabase-js + realtime).
