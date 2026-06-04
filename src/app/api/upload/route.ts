import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToIPFS } from '@/lib/ipfs'

export const runtime = 'nodejs'
export const maxDuration = 30

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])
const MAX_BYTES = 10 * 1024 * 1024  // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Se requiere un archivo de imagen' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}. Sube una imagen JPEG, PNG, GIF o WebP.` },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande. Máximo 10 MB.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(arrayBuffer)
    const { ipfsUri, gatewayUrl } = await uploadImageToIPFS(buffer, file.name, file.type)

    return NextResponse.json({
      ipfsUri,
      gatewayUrl,
      filename: file.name,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[NEXUS:upload] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
