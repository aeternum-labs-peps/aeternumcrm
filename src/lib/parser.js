// ============================================================
// PARSER DE AUTO-ETIQUETAGEM (Seção 5 do masterprompt)
// Na integração real, este parser roda no n8n (webhook da
// Evolution API) antes de gravar no Supabase. Aqui ele roda
// no cliente para o MODO DEMO.
// ============================================================

// Apelidos de produto -> nome do catálogo
export const PRODUCT_ALIASES = {
  'reta': 'Retatrutide',
  'retatrutide': 'Retatrutide',
  'retatrutida': 'Retatrutide',
  'slu': 'SLU-PP-332',
  'slu-pp-332': 'SLU-PP-332',
  'slupp332': 'SLU-PP-332',
  'mots-c': 'MOTS-C',
  'motsc': 'MOTS-C',
  'mots c': 'MOTS-C',
  'selank': 'Selank',
  'gh': 'GH Somatropina',
  'somatropina': 'GH Somatropina',
  'gh somatropina': 'GH Somatropina',
  'ss-31': 'SS-31',
  'ss31': 'SS-31',
  'ghk-cu': 'GHK-Cu',
  'ghk cu': 'GHK-Cu',
  'ghkcu': 'GHK-Cu',
  'bpc': 'BPC-157',
  'bpc-157': 'BPC-157',
  'bpc157': 'BPC-157',
  'tb': 'TB-500',
  'tb-500': 'TB-500',
  'tb500': 'TB-500',
}

// Normaliza: remove acentos, minúsculas
export function norm(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function slugify(s) {
  return norm(s).trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Normaliza mantendo mapa de índices para recuperar o texto original
function normWithMap(s) {
  let out = ''
  const map = []
  for (let i = 0; i < s.length; i++) {
    const d = s[i].normalize('NFD').replace(/[̀-ͯ]/g, '')
    for (const ch of d) {
      out += ch.toLowerCase()
      map.push(i)
    }
  }
  return { out, map }
}

function titleCase(s) {
  return s
    .trim()
    .split(/\s+/)
    .map(w => (w.length > 2 || w === w.toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase()))
    .join(' ')
}

function resolveProduct(raw, catalog) {
  const t = norm(raw).replace(/[.!?,;]+$/, '').trim()
  if (PRODUCT_ALIASES[t]) return PRODUCT_ALIASES[t]
  // tenta bater com o catálogo diretamente
  for (const p of catalog) {
    if (norm(p) === t || norm(p).includes(t) || t.includes(norm(p))) return p
  }
  return titleCase(raw.replace(/[.!?,;]+$/, '').trim())
}

/**
 * Detecta variações de:
 *   "venho pel[o|a] [Instagram d[o|a] ]<NOME> e quero comprar <PRODUTO>"
 * Ignora acentos e maiúsculas. Retorna { afiliadoNome, produto } ou null.
 */
export function parseIntroMessage(text, catalog = []) {
  const { out, map } = normWithMap(text)
  const re = /venho\s+pel[oa]\s+(?:perfil\s+d[oa]\s+)?(?:instagram\s+(?:d[oa]\s+)?)?(.+?)\s+e\s+quero\s+comprar\s+(?:a\s+|o\s+|um\s+|uma\s+)?(.+?)[\s.!?,;]*$/d
  const m = re.exec(out)
  if (!m) return null

  const [nameStart, nameEnd] = m.indices[1]
  const origName = text.slice(map[nameStart], map[nameEnd - 1] + 1)
  const rawProduct = m[2]

  return {
    afiliadoNome: titleCase(origName),
    produto: resolveProduct(rawProduct, catalog),
  }
}
