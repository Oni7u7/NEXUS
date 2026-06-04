/**
 * NEXUS — Wrapper de la API de Bitso
 *
 * Incluye endpoints públicos (ticker, order book, trades) y
 * el endpoint autenticado de retiro SPEI.
 */

import { createHmac } from 'crypto'

const BITSO_BASE_URL = 'https://api.bitso.com/v3'

async function bitsoFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BITSO_BASE_URL}${path}`, {
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
  })

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

  const path = '/v3/withdrawals/'
  const method = 'POST'
  const nonce = Date.now().toString()

  const payload = {
    currency: 'mxn',
    amount: safeAmount.toFixed(2),
    clabe: params.clabe,
    notes_ref: params.reference,
    numeric_ref: nonce.slice(-7),  // referencia numérica de 7 dígitos
  }

  const body = JSON.stringify(payload)
  const message = nonce + method + path + body
  const signature = createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex')

  const authHeader = `Bitso ${apiKey}:${nonce}:${signature}`

  const res = await fetch(`${BITSO_BASE_URL}/withdrawals/`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    // Si es error de permisos (API personal sin permisos de retiro), usar modo demo
    if (res.status === 403 || text.includes('0202')) {
      console.warn('[NEXUS:bitso] Sin permisos de retiro — modo demo activado')
      return {
        withdrawalId: `NEXUS-DEMO-${Date.now()}`,
        status: 'simulated' as const,
        amount: params.amountMXN.toFixed(2),
        currency: 'mxn' as const,
        mock: true
      }
    }
    throw new Error(`Bitso SPEI withdrawal error ${res.status}: ${text}`)
  }

  const json = await res.json()
  if (!json.success) {
    throw new Error(`Bitso SPEI error: ${json.error?.message ?? 'Unknown'}`)
  }

  const result = json.payload
  return {
    withdrawalId: result.wid ?? result.id ?? `NEXUS-${Date.now()}`,
    status: result.status ?? 'pending',
    amount: safeAmount.toFixed(2),
    currency: 'mxn',
  }
}
