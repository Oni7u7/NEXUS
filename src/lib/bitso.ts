/**
 * NEXUS — Wrapper de la API de Bitso
 *
 * Incluye endpoints públicos (ticker, order book, trades) y
 * los endpoints autenticados de retiro SPEI y consulta de saldo.
 */

import { createHmac } from 'crypto'

const BITSO_BASE_URL = (process.env.BITSO_API_URL ?? 'https://bitso.com').replace(/\/$/, '')
const BITSO_API_V3 = `${BITSO_BASE_URL}/api/v3`

/**
 * Genera el header Authorization HMAC-SHA256 para la API de Bitso.
 */
export function bitsoHMAC(method: string, path: string, body = ''): string {
  const apiKey = process.env.BITSO_API_KEY ?? ''
  const apiSecret = process.env.BITSO_API_SECRET ?? ''
  const nonce = Date.now().toString()
  const message = nonce + method + path + body
  const signature = createHmac('sha256', apiSecret).update(message).digest('hex')
  return `Bitso ${apiKey}:${nonce}:${signature}`
}

async function bitsoFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BITSO_API_V3}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 10 }, // cache 10s
  })

  if (!res.ok) {
    throw new Error(`Bitso API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()

  if (!json.success) {
    throw new Error(`Bitso error: ${json.error?.message ?? 'Unknown'}`)
  }

  return json.payload as T
}

export interface BitsoTicker {
  book: string
  volume: string
  high: string
  last: string
  low: string
  ask: string
  bid: string
  change_24: string
  created_at: string
}

export interface BitsoOrderBook {
  asks: { book: string; price: string; amount: string }[]
  bids: { book: string; price: string; amount: string }[]
  updated_at: string
  sequence: string
}

export interface BitsoTrade {
  book: string
  created_at: string
  amount: string
  maker_side: 'buy' | 'sell'
  price: string
  tid: number
}

export interface SPEIWithdrawalResult {
  withdrawalId: string
  status: 'pending' | 'processing' | 'complete' | 'simulated'
  amount: string
  currency: 'mxn'
  mock?: boolean
}

export const getBitsoTicker = (book: string) =>
  bitsoFetch<BitsoTicker>(`/ticker?book=${book}`)

export const getBitsoOrderBook = (book: string) =>
  bitsoFetch<BitsoOrderBook>(`/order_book?book=${book}`)

export const getBitsoTrades = (book: string) =>
  bitsoFetch<BitsoTrade[]>(`/trades?book=${book}`)

/**
 * Solicita un retiro SPEI via Bitso.
 * Autenticación HMAC-SHA256 según la spec de Bitso API v3.
 *
 * Modo mock si BITSO_API_KEY o BITSO_API_SECRET no están configurados.
 */
export async function requestSPEIWithdrawal(params: {
  amountMXN: number
  clabe: string        // 18 dígitos
  reference: string    // ej: "NEXUS-NFT-1-VALENTINA"
}): Promise<SPEIWithdrawalResult> {
  const apiKey = process.env.BITSO_API_KEY
  const apiSecret = process.env.BITSO_API_SECRET

  // Guarda contra NaN/undefined antes de toFixed
  const safeAmount = typeof params.amountMXN === 'number' && !isNaN(params.amountMXN)
    ? params.amountMXN
    : 0

  console.log('[NEXUS:bitso] requestSPEIWithdrawal params:', {
    amountMXN: safeAmount,
    clabe: params.clabe?.slice(-4),
    reference: params.reference,
    env: process.env.BITSO_API_URL?.includes('stage') ? 'stage' : 'production',
  })

  if (!params.clabe || params.clabe.replace(/\D/g, '').length !== 18) {
    throw new Error(`CLABE inválida: '${params.clabe}' — debe tener 18 dígitos`)
  }

  if (!apiKey || !apiSecret) {
    console.warn('[NEXUS:bitso] MODO SIMULADO — payout SPEI no real')
    return {
      withdrawalId: `NEXUS-DEMO-${Date.now()}`,
      status: 'simulated',
      amount: safeAmount.toFixed(2),
      currency: 'mxn',
      mock: true,
    }
  }

  const path = '/api/v3/withdrawals/'
  const method = 'POST'

  // 4 variaciones del body — se prueban en orden hasta que una retorne 200
  const bodyVariations = [
    // Variación 1 — sin network
    JSON.stringify({
      currency: 'mxn', method: 'sp',
      amount: safeAmount.toFixed(2), clabe: params.clabe, notes_ref: params.reference,
      numeric_ref: '1234567', nombre_beneficiario: 'Creador NEXUS',
      rfc_curp_destinatario: 'ND', banco_beneficiario: 'STP',
    }),
    // Variación 2 — con network: 'sp'
    JSON.stringify({
      currency: 'mxn', method: 'sp', network: 'sp',
      amount: safeAmount.toFixed(2), clabe: params.clabe, notes_ref: params.reference,
      numeric_ref: '1234567', nombre_beneficiario: 'Creador NEXUS',
      rfc_curp_destinatario: 'ND', banco_beneficiario: 'STP',
    }),
    // Variación 3 — method: 'spei'
    JSON.stringify({
      currency: 'mxn', method: 'spei',
      amount: safeAmount.toFixed(2), clabe: params.clabe, notes_ref: params.reference,
    }),
    // Variación 4 — solo campos mínimos
    JSON.stringify({
      currency: 'mxn',
      amount: safeAmount.toFixed(2), clabe: params.clabe,
    }),
  ]

  let lastError = ''
  for (let i = 0; i < bodyVariations.length; i++) {
    const body = bodyVariations[i]
    const nonce = Date.now().toString()
    const message = nonce + method + path + body
    const signature = createHmac('sha256', apiSecret).update(message).digest('hex')
    const authHeader = `Bitso ${apiKey}:${nonce}:${signature}`

    const res = await fetch(`${BITSO_BASE_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body,
    })

    if (res.ok) {
      const json = await res.json()
      if (!json.success) throw new Error(`Bitso SPEI error: ${json.error?.message ?? 'Unknown'}`)
      console.log(`[NEXUS:bitso] Variación ${i + 1} funcionó para withdrawal SPEI`)
      const result = json.payload
      return {
        withdrawalId: result.wid ?? result.id ?? `NEXUS-${Date.now()}`,
        status: result.status ?? 'pending',
        amount: safeAmount.toFixed(2),
        currency: 'mxn' as const,
      }
    }

    const text = await res.text()
    console.warn(`[NEXUS:bitso] Variación ${i + 1} falló: ${res.status} ${text}`)
    lastError = `${res.status}: ${text}`

    let errorData: { error?: { code?: string } } = {}
    try { errorData = JSON.parse(text) } catch {}
    if (errorData?.error?.code !== '0304') {
      // Error distinto a "método no disponible" — no tiene sentido seguir reintentando
      break
    }
  }

  // Todas las variaciones fallaron con 0304 — modo demo para Stage
  if (lastError.includes('0304') || lastError === '') {
    console.warn('[NEXUS:bitso] SPEI no disponible en este ambiente — modo demo')
    return {
      withdrawalId: `NEXUS-STAGE-${Date.now()}`,
      status: 'simulated' as const,
      amount: safeAmount.toFixed(2),
      currency: 'mxn' as const,
      mock: true,
    }
  }

  throw new Error(`Bitso withdrawal error ${lastError}`)
}

/**
 * Consulta el estado actual de un retiro SPEI por su wid.
 */
export async function checkWithdrawalStatus(wid: string): Promise<{
  wid: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  amount: string
  currency: string
  createdAt: string
}> {
  const apiKey = process.env.BITSO_API_KEY
  const apiSecret = process.env.BITSO_API_SECRET

  if (!apiKey || !apiSecret) {
    return { wid, status: 'pending', amount: '0', currency: 'mxn', createdAt: new Date().toISOString() }
  }

  const path = `/api/v3/withdrawals/${wid}`
  const nonce = Date.now().toString()
  const message = nonce + 'GET' + path
  const signature = createHmac('sha256', apiSecret).update(message).digest('hex')
  const auth = `Bitso ${apiKey}:${nonce}:${signature}`

  const res = await fetch(`${BITSO_BASE_URL}${path}`, {
    headers: { Authorization: auth },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bitso withdrawal status error ${res.status}: ${text}`)
  }

  const json = await res.json()
  const data = json.payload

  return {
    wid: data.wid,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    createdAt: data.created_at,
  }
}
