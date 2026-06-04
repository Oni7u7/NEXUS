import { NextRequest, NextResponse } from 'next/server'
import { nexusRegistry } from '@/lib/contracts'

export const runtime = 'nodejs'

// GET /api/earnings?address=0x...
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')

  if (!address || !address.startsWith('0x')) {
    return NextResponse.json(
      { error: 'Se requiere una address válida' },
      { status: 400 }
    )
  }

  try {
    const totalMXNCents = await nexusRegistry.getCreatorEarnings(address)
    const totalMXN = totalMXNCents / 100  // los centavos se dividen entre 100

    const isMock = !process.env.NEXUS_REGISTRY_ADDRESS ||
      process.env.NEXUS_REGISTRY_ADDRESS.startsWith('0x000')

    return NextResponse.json({
      address,
      totalMXN,
      totalMXNCents: totalMXNCents.toString(),
      mock: isMock || undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[NEXUS:api/earnings] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
