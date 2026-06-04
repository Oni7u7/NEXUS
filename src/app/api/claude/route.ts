import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/agents'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Decodifica el payload de un JWT de Privy sin verificar la firma.
 * Suficiente para extraer el sub y detectar requests sin sesión válida.
 * Para verificación criptográfica completa instala @privy-io/server.
 */
function decodePrivyToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
    return JSON.parse(payload) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const limit = rateLimitMap.get(ip)

  if (limit && now < limit.resetAt && limit.count >= 20) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429 }
    )
  }

  if (!limit || now >= limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
  } else {
    limit.count++
  }

  try {
    const body = await req.json()
    const { message, context, history = [] } = body as {
      message: string
      context?: Record<string, unknown>
      history?: Array<{ role: string; content: string }>
    }

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Valida autenticación cuando el contexto incluye una colección activa.
    // Un usuario no autenticado no debería poder operar sobre activos de otro.
    if (context?.collectionAddress) {
      const authHeader = req.headers.get('authorization') ?? ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

      if (!token) {
        return NextResponse.json(
          { error: 'Authorization required to operate on an active collection' },
          { status: 401 }
        )
      }

      const payload = decodePrivyToken(token)
      // El token debe estar presente y no expirado
      if (!payload || !payload.sub) {
        return NextResponse.json(
          { error: 'Invalid or expired session token' },
          { status: 401 }
        )
      }

      const now = Math.floor(Date.now() / 1000)
      if (typeof payload.exp === 'number' && payload.exp < now) {
        return NextResponse.json(
          { error: 'Session token expired — please reconnect your wallet' },
          { status: 401 }
        )
      }
    }

    const result = await runAgent({ message, context, history })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[NEXUS:api/claude] Error completo:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
