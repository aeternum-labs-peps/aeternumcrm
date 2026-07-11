// ============================================================
// DADOS DEMO (Seção 13 do masterprompt)
// Na integração real, tudo isso vem do Supabase (PostgreSQL).
// As tabelas espelham a Seção 3: afiliados, leads, mensagens,
// vendas, usuários.
// ============================================================

const DAY = 86400000
const now = Date.now()

export const PRODUCTS = [
  'Retatrutide', 'SLU-PP-332', 'MOTS-C', 'Selank', 'GH Somatropina',
  'SS-31', 'GHK-Cu', 'BPC-157', 'TB-500',
]

export const LOSS_REASONS = [
  'Preço', 'Sem resposta', 'Comprou de concorrente', 'Desistiu da compra',
  'Fora do perfil', 'Outro',
]

export const TEAM = [
  { id: 'u-admin', nome: 'Dharman Carneiro', papel: 'admin' },
  { id: 'u-com1', nome: 'Rafael Costa', papel: 'comercial' },
  { id: 'u-com2', nome: 'Juliana Prado', papel: 'comercial' },
]

export const AFFILIATES = [
  { id: 'af-lucas', nome: 'Lucas Gomes', instagram: '@lucasgomes.fit', foto: null, status: 'ativo', percentualComissao: 15, tagSlug: 'lucas-gomes', criadoEm: now - 120 * DAY },
  { id: 'af-thais', nome: 'Thaís', instagram: '@thais.wellness', foto: null, status: 'ativo', percentualComissao: 15, tagSlug: 'thais', criadoEm: now - 95 * DAY },
  { id: 'af-carol', nome: 'Carol', instagram: '@carolbiohack', foto: null, status: 'ativo', percentualComissao: 15, tagSlug: 'carol', criadoEm: now - 80 * DAY },
  { id: 'af-levy', nome: 'Levy', instagram: '@levy.performance', foto: null, status: 'ativo', percentualComissao: 15, tagSlug: 'levy', criadoEm: now - 60 * DAY },
]

// CRM em produção: começa vazio — os leads reais entram pelo WhatsApp.
// (Os dados fictícios ficam guardados abaixo em DEMO_LEAD_ROWS, caso um dia
// queira repovoar uma demonstração.)
const LEAD_ROWS = []

// [nome, dddNum, afiliadoId|null, produto, etapa, responsavelId, diasAtras, diasNaEtapa, valorVenda?, motivoPerda?, respondeu?]
const DEMO_LEAD_ROWS = [
  ['Mariana Silva',    '11987201134', 'af-lucas', 'Retatrutide',    1, 'u-com1', 0.1, 0.1, null, null, true],
  ['João Pedro Alves', '21996402251', 'af-thais', 'Retatrutide',    1, 'u-com2', 0.4, 0.4, null, null, true],
  ['Fernanda Rocha',   '31988113472', 'af-carol', 'BPC-157',        1, 'u-com1', 1,   1],
  ['Ricardo Nunes',    '41991307786', 'af-levy',  'Retatrutide',    1, 'u-com2', 2,   2],
  ['Paula Andrade',    '11996523318', null,       'MOTS-C',         1, 'u-com1', 1.5, 1.5],
  ['Bruno Carvalho',   '51993217645', 'af-lucas', 'SLU-PP-332',     2, 'u-com1', 3,   1, null, null, true],
  ['Camila Duarte',    '61992114533', 'af-thais', 'Retatrutide',    2, 'u-com2', 4,   2],
  ['Eduardo Lima',     '71993318867', 'af-carol', 'TB-500',         2, 'u-com1', 5,   3],
  ['Aline Ferreira',   '85991226910', 'af-levy',  'Retatrutide',    3, 'u-com2', 6,   2, null, null, true],
  ['Gustavo Ramos',    '11994417702', 'af-lucas', 'GH Somatropina', 3, 'u-com1', 7,   3],
  ['Beatriz Moura',    '19995528813', 'af-thais', 'Selank',         3, 'u-com2', 8,   4],
  ['Otávio Pinheiro',  '27996639924', 'af-carol', 'Retatrutide',    4, 'u-com1', 9,   2],
  ['Larissa Campos',   '31997741035', 'af-lucas', 'Retatrutide',    4, 'u-com2', 10,  3, null, null, true],
  ['Henrique Souza',   '47998852146', 'af-levy',  'SS-31',          4, 'u-com1', 11,  4],
  ['Renata Borges',    '11999963257', 'af-thais', 'Retatrutide',    5, 'u-com2', 12,  2],
  ['Felipe Teixeira',  '21991074368', 'af-lucas', 'GHK-Cu',         5, 'u-com1', 13,  3],
  ['Vanessa Prado',    '31992185479', 'af-carol', 'Retatrutide',    6, 'u-com2', 14,  1],
  ['Marcelo Dias',     '41993296580', 'af-levy',  'Retatrutide',    6, 'u-com1', 15,  2, null, null, true],
  // GANHOS — mês atual
  ['Sofia Martins',    '11994307691', 'af-lucas', 'Retatrutide',    'ganho', 'u-com1', 8,  0, 2890],
  ['Diego Antunes',    '21995418702', 'af-lucas', 'Retatrutide',    'ganho', 'u-com2', 12, 0, 3450],
  ['Isabela Freitas',  '31996529813', 'af-thais', 'Retatrutide',    'ganho', 'u-com1', 6,  0, 2890],
  ['Thiago Barros',    '41997630924', 'af-carol', 'BPC-157',        'ganho', 'u-com2', 10, 0, 1580],
  ['Amanda Vieira',    '51998741035', 'af-levy',  'Retatrutide',    'ganho', 'u-com1', 4,  0, 4120],
  ['Rodrigo Peçanha',  '61999852146', 'af-thais', 'MOTS-C',         'ganho', 'u-com2', 15, 0, 1890],
  // GANHOS — mês anterior (para o histórico de fechamento)
  ['Carla Menezes',    '71990963257', 'af-lucas', 'Retatrutide',    'ganho', 'u-com1', 38, 0, 3200],
  ['Pedro Cardoso',    '81991074368', 'af-thais', 'Retatrutide',    'ganho', 'u-com2', 42, 0, 2890],
  ['Luana Siqueira',   '91992185479', 'af-carol', 'Selank',         'ganho', 'u-com1', 45, 0, 1450],
  ['André Fontes',     '11993296580', 'af-levy',  'Retatrutide',    'ganho', 'u-com2', 40, 0, 3780],
  // PERDIDOS
  ['Vitor Hugo Reis',  '21994307691', 'af-lucas', 'Retatrutide',    'perdido', 'u-com1', 20, 0, null, 'Preço'],
  ['Natália Cunha',    '31995418702', 'af-thais', 'TB-500',         'perdido', 'u-com2', 25, 0, null, 'Sem resposta'],
  ['Igor Vasconcelos', '41996529813', 'af-carol', 'Retatrutide',    'perdido', 'u-com1', 30, 0, null, 'Comprou de concorrente'],
]

function introText(afiliadoId, produto) {
  const af = AFFILIATES.find(a => a.id === afiliadoId)
  const apelido = produto === 'Retatrutide' ? 'a Reta' : (produto === 'GH Somatropina' ? 'o GH' : `o ${produto}`)
  if (!af) return `Olá! Vi um anúncio de vocês e quero saber mais sobre ${apelido}.`
  const art = ['af-thais', 'af-carol'].includes(af.id) ? 'da' : 'do'
  return `Olá tudo bem? Eu venho pelo Instagram ${art} ${af.nome} e quero comprar ${apelido}`
}

export function buildDemoState() {
  const leads = []
  const messages = []
  const sales = []
  let mi = 0

  LEAD_ROWS.forEach((row, i) => {
    const [nome, fone, afId, produto, etapa, respId, diasAtras, diasNaEtapa, valor, motivo, respondeu] = row
    const criadoEm = now - diasAtras * DAY
    const leadId = `ld-${i + 1}`
    leads.push({
      id: leadId,
      nome,
      telefone: `55${fone}`,
      afiliadoId: afId,
      produtoInteresse: produto,
      etapa,
      responsavelId: respId,
      valorVenda: valor || null,
      motivoPerda: motivo || null,
      criadoEm,
      etapaDesde: now - (diasNaEtapa || 0) * DAY,
      ultimaAtualizacao: now - (diasNaEtapa || 0) * DAY * 0.5,
      respondeu: !!respondeu,
      origemMensagem: introText(afId, produto),
    })

    // Conversa: mensagem de entrada + trocas
    messages.push({ id: `msg-${++mi}`, leadId, direcao: 'recebida', texto: introText(afId, produto), timestamp: criadoEm, remetente: nome })
    messages.push({ id: `msg-${++mi}`, leadId, direcao: 'enviada', texto: `Olá ${nome.split(' ')[0]}! Seja bem-vindo(a) à ÆTERNUM PEPTIDES 🧬 Vou te passar todas as informações. Você já utilizou ${produto} antes?`, timestamp: criadoEm + 600000, remetente: 'ÆTERNUM' })
    if (etapa !== 1) {
      messages.push({ id: `msg-${++mi}`, leadId, direcao: 'recebida', texto: 'Ainda não, seria minha primeira vez. Como funciona o protocolo?', timestamp: criadoEm + 3600000, remetente: nome })
      messages.push({ id: `msg-${++mi}`, leadId, direcao: 'enviada', texto: 'Perfeito! Vou te enviar o guia completo com dosagens e o valor do kit. Um momento 🙏', timestamp: criadoEm + 4200000, remetente: 'ÆTERNUM' })
    }
    if (etapa === 'ganho') {
      messages.push({ id: `msg-${++mi}`, leadId, direcao: 'recebida', texto: 'Fechado! Acabei de fazer o pagamento ✅', timestamp: criadoEm + 2 * DAY, remetente: nome })
      messages.push({ id: `msg-${++mi}`, leadId, direcao: 'enviada', texto: 'Pagamento confirmado! Seu pedido já está em separação. Obrigado pela confiança 🧬✨', timestamp: criadoEm + 2 * DAY + 900000, remetente: 'ÆTERNUM' })
    }
    if (respondeu) {
      messages.push({ id: `msg-${++mi}`, leadId, direcao: 'recebida', texto: 'Oi! Conseguiu ver minha última mensagem? Ainda tenho interesse 😊', timestamp: now - 0.05 * DAY, remetente: nome })
    }

    if (etapa === 'ganho' && valor) {
      const af = AFFILIATES.find(a => a.id === afId)
      const pctCom = af ? af.percentualComissao : 15
      sales.push({
        id: `vd-${leadId}`,
        leadId,
        afiliadoId: afId,
        valor,
        produto,
        data: criadoEm + 2 * DAY,
        comissaoCalculada: +(valor * pctCom / 100).toFixed(2),
      })
    }
  })

  return {
    user: null,
    affiliates: [...AFFILIATES],
    leads,
    messages,
    sales,
    products: [...PRODUCTS],
    team: [...TEAM],
    closings: {},
    whatsapp: { status: 'desconectado', importado: false },
    toasts: [],
  }
}
