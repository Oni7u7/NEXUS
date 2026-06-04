import { NextRequest, NextResponse } from 'next/server'
import { rare } from '@/lib/rare'

export const runtime = 'nodejs'

// Solo operaciones de lectura — nunca deploys, mints ni writes desde aquí
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const command = searchParams.get('command')

  try {
    let data: unknown

    switch (command) {
      case 'search_auctions': {
        const query = searchParams.get('query') ?? undefined
        const limitParam = searchParams.get('limit')
        const limit = limitParam ? parseInt(limitParam) : 20
        const result = await rare.searchMarket({ query, state: 'RUNNING', limit })

        if (result.success && result.items.length === 0) {
          // Sin subastas propias en Sepolia — muestra mercado global como referencia
          const globalResult = await rare.searchMarket({ limit: 6 })
          if (globalResult.success && globalResult.items.length > 0) {
            data = {
              ...globalResult,
              items: globalResult.items.map((item) => ({ ...item, isGlobal: true })),
            }
            break
          }
        }

        data = result
        break
      }

      case 'auction_status': {
        const contract = searchParams.get('contract')
        const tokenIdParam = searchParams.get('tokenId')
        if (!contract || !tokenIdParam) {
          return NextResponse.json(
            { success: false, error: 'Se requieren contract y tokenId' },
            { status: 400 }
          )
        }
        data = await rare.auctionStatus(contract, parseInt(tokenIdParam))
        break
      }

      case 'collection_status': {
        const contract = searchParams.get('contract')
        if (!contract) {
          return NextResponse.json(
            { success: false, error: 'Se requiere contract' },
            { status: 400 }
          )
        }
        // Busca NFTs de esta colección específica
        data = await rare.searchMarket({ limit: 50 })
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Comando desconocido: ${command}` },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[NEXUS:api/rare] Error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
