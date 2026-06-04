import { NextRequest, NextResponse } from 'next/server'
import { getBitsoTicker, getBitsoOrderBook, getBitsoTrades } from '@/lib/bitso'

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
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: ticker | order_book | trades' },
          { status: 400 }
        )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
