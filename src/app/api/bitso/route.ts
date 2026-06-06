import { NextRequest, NextResponse } from 'next/server'
import { getBitsoTicker, getBitsoOrderBook, getBitsoTrades, checkWithdrawalStatus, bitsoHMAC } from '@/lib/bitso'

const BITSO_BASE_URL = (process.env.BITSO_API_URL ?? 'https://bitso.com').replace(/\/$/, '')

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const book = searchParams.get('book') ?? 'btc_mxn'

  try {
    switch (action) {
      case 'ticker':
        return NextResponse.json(await getBitsoTicker(book))
      case 'order_book':
        return NextResponse.json(await getBitsoOrderBook(book))
      case 'trades':
        return NextResponse.json(await getBitsoTrades(book))
      case 'withdrawal_status': {
        const wid = searchParams.get('wid')
        if (!wid) return NextResponse.json({ error: 'wid requerido' }, { status: 400 })
        return NextResponse.json(await checkWithdrawalStatus(wid))
      }
      case 'withdrawal_methods': {
        const endpoints = [
          '/api/v3/withdrawals/',
          '/api/v3/withdrawal_methods/',
          '/api/v3/mx/spei/withdrawal/',
          '/api/v3/payment_methods/',
        ]

        const { createHmac } = await import('crypto')
        const results: Record<string, unknown> = {}

        for (const path of endpoints) {
          try {
            const nonce = Date.now().toString()
            const message = nonce + 'GET' + path
            const sig = createHmac('sha256', process.env.BITSO_API_SECRET ?? '')
              .update(message)
              .digest('hex')
            const auth = `Bitso ${process.env.BITSO_API_KEY}:${nonce}:${sig}`

            const res = await fetch(`${BITSO_BASE_URL}${path}`, {
              headers: { Authorization: auth },
            })
            results[path] = { status: res.status, body: await res.text() }
          } catch (e) {
            results[path] = { error: e instanceof Error ? e.message : String(e) }
          }
        }

        return NextResponse.json(results)
      }
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: ticker | order_book | trades | withdrawal_status' },
          { status: 400 }
        )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
